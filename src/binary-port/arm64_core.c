#include <stdint.h>

enum {
  ARM64_STATUS_RUNNING = 0,
  ARM64_STATUS_HALTED = 1,
  ARM64_STATUS_SYSCALL = 2,
  ARM64_STATUS_HOSTCALL = 3,
  ARM64_STATUS_TRACEPOINT = 4,
  ARM64_STATUS_WATCHPOINT = 5,
  ARM64_FAULT_UNKNOWN_INSTRUCTION = -1,
  ARM64_FAULT_MEMORY = -2,
  ARM64_FAULT_ALIGNMENT = -3,
};

typedef struct {
  uint64_t x[31];
  uint64_t q_lo[32];
  uint64_t q_hi[32];
  uint64_t sp;
  uint64_t pc;
  uint64_t steps;
  uint32_t nzcv;
  uint32_t memory_bias;
  uint32_t last_instruction;
  int32_t status;
  uint64_t fault_address;
} Arm64State;

static Arm64State cpu;
#define ARM64_CALLBACK_DEPTH 8
static Arm64State callback_parent_cpu[ARM64_CALLBACK_DEPTH];
static uint32_t callback_depth;
#define ARM64_SUSPENDED_CONTEXTS 64
static Arm64State suspended_contexts[ARM64_SUSPENDED_CONTEXTS];
static uint8_t suspended_context_active[ARM64_SUSPENDED_CONTEXTS];
#define ARM64_RECENT_CALLS 65536
static uint64_t recent_call_pc[ARM64_RECENT_CALLS];
static uint64_t recent_call_target[ARM64_RECENT_CALLS];
static uint32_t recent_call_index;
static uint64_t register_write_pc[31];
static uint64_t value_60_write_pc[64];
static uint32_t value_60_write_register[64];
static uint32_t value_60_write_index;
static uint64_t first_x28_value_60_write_pc;
static uint32_t diagnostics_enabled = 1;
static uint64_t tracepoint_pc;
static uint32_t module_trace_enabled;
static uint64_t watchpoint_address;
static uint64_t watchpoint_store_address;
static uint64_t watchpoint_value;
static uint32_t watchpoint_size;
static uint32_t watchpoint_loads;
static uint64_t watchpoint_length;
/*
 * The imported linear memory is grown by the JavaScript runtime, not by the
 * guest.  Cache its current byte length so every guest load/store does not
 * have to issue a memory.size instruction.  The host refreshes this value
 * immediately after each grow; the fallback keeps the standalone core probes
 * safe before the first host refresh.
 */
static uint64_t cached_memory_bytes;

static void copy_cpu_state(Arm64State *destination, const Arm64State *source) {
  uint8_t *output = (uint8_t *)destination;
  const uint8_t *input = (const uint8_t *)source;
  for (uint32_t index = 0; index < sizeof(Arm64State); index++) output[index] = input[index];
}

static void record_call(uint64_t pc, uint64_t target) {
  if (!diagnostics_enabled) return;
  uint32_t slot = recent_call_index++ & (ARM64_RECENT_CALLS - 1);
  recent_call_pc[slot] = pc;
  recent_call_target[slot] = target;
}

static uint64_t sign_extend(uint64_t value, uint32_t bits) {
  uint64_t sign = UINT64_C(1) << (bits - 1);
  return (value ^ sign) - sign;
}

static uint64_t width_mask(uint32_t bits) {
  return bits == 64 ? UINT64_MAX : (UINT64_C(1) << bits) - 1;
}

static uint64_t rotate_right(uint64_t value, uint32_t amount, uint32_t bits) {
  uint64_t mask = width_mask(bits);
  amount %= bits;
  value &= mask;
  return amount == 0 ? value : ((value >> amount) | (value << (bits - amount))) & mask;
}

static uint64_t arithmetic_shift_right(uint64_t value, uint32_t amount, uint32_t bits) {
  uint64_t mask = width_mask(bits);
  value &= mask;
  if (amount == 0) return value;
  uint64_t result = value >> amount;
  if (value & (UINT64_C(1) << (bits - 1))) result |= mask ^ width_mask(bits - amount);
  return result & mask;
}

static uint64_t reverse_bits(uint64_t value, uint32_t bits) {
  uint64_t result = 0;
  for (uint32_t bit = 0; bit < bits; bit++) result |= ((value >> bit) & 1) << (bits - 1 - bit);
  return result;
}

static uint64_t reverse_bytes_in_lanes(uint64_t value, uint32_t bits, uint32_t lane_bits) {
  uint64_t result = 0;
  uint32_t lane_bytes = lane_bits / 8;
  for (uint32_t lane = 0; lane < bits; lane += lane_bits) {
    for (uint32_t byte = 0; byte < lane_bytes; byte++) {
      uint32_t source = lane + byte * 8;
      uint32_t destination = lane + (lane_bytes - 1 - byte) * 8;
      result |= ((value >> source) & 0xff) << destination;
    }
  }
  return result;
}

static uint32_t count_leading_zeros(uint64_t value, uint32_t bits) {
  uint32_t count = 0;
  for (uint32_t bit = bits; bit > 0 && ((value >> (bit - 1)) & 1) == 0; bit--) count++;
  return count;
}

static uint64_t multiply_high_unsigned(uint64_t left, uint64_t right) {
  uint64_t left_low = (uint32_t)left;
  uint64_t left_high = left >> 32;
  uint64_t right_low = (uint32_t)right;
  uint64_t right_high = right >> 32;
  uint64_t low_product = left_low * right_low;
  uint64_t cross_left = left_low * right_high;
  uint64_t cross_right = left_high * right_low;
  uint64_t middle = (low_product >> 32) + (uint32_t)cross_left + (uint32_t)cross_right;
  return left_high * right_high + (cross_left >> 32) + (cross_right >> 32) + (middle >> 32);
}

static uint32_t fp_memory_size(uint32_t instruction) {
  uint32_t size_log2 = instruction >> 30;
  uint32_t opc = (instruction >> 22) & 3;
  if (opc < 2) return 1u << size_log2;
  return size_log2 == 0 ? 16 : 0;
}

static void set_add_sub_flags(uint64_t left, uint64_t right, uint64_t result, uint32_t bits, int subtract) {
  uint64_t mask = width_mask(bits);
  uint64_t sign = UINT64_C(1) << (bits - 1);
  left &= mask;
  right &= mask;
  result &= mask;
  uint32_t n = (result & sign) != 0;
  uint32_t z = result == 0;
  uint32_t c;
  uint32_t v;
  if (subtract) {
    c = left >= right;
    v = ((left ^ right) & (left ^ result) & sign) != 0;
  } else {
    c = result < left;
    v = ((~(left ^ right)) & (left ^ result) & sign) != 0;
  }
  cpu.nzcv = (n << 31) | (z << 30) | (c << 29) | (v << 28);
}

static int condition_holds(uint32_t condition) {
  uint32_t n = (cpu.nzcv >> 31) & 1;
  uint32_t z = (cpu.nzcv >> 30) & 1;
  uint32_t c = (cpu.nzcv >> 29) & 1;
  uint32_t v = (cpu.nzcv >> 28) & 1;
  switch (condition & 15) {
    case 0: return z;
    case 1: return !z;
    case 2: return c;
    case 3: return !c;
    case 4: return n;
    case 5: return !n;
    case 6: return v;
    case 7: return !v;
    case 8: return c && !z;
    case 9: return !c || z;
    case 10: return n == v;
    case 11: return n != v;
    case 12: return !z && n == v;
    case 13: return z || n != v;
    default: return 1;
  }
}

static int decode_logical_immediate(uint32_t instruction, uint32_t bits, uint64_t *result) {
  uint32_t n = (instruction >> 22) & 1;
  uint32_t immr = (instruction >> 16) & 0x3f;
  uint32_t imms = (instruction >> 10) & 0x3f;
  uint32_t combined = (n << 6) | ((~imms) & 0x3f);
  int32_t length = -1;
  for (int32_t bit = 6; bit >= 0; bit--) {
    if (combined & (1u << bit)) { length = bit; break; }
  }
  if (length < 1) return 0;
  uint32_t levels = (1u << length) - 1;
  uint32_t s = imms & levels;
  uint32_t r = immr & levels;
  if (s == levels) return 0;
  uint32_t element_bits = 1u << length;
  uint64_t element = rotate_right(width_mask(s + 1), r, element_bits);
  uint64_t mask = 0;
  for (uint32_t offset = 0; offset < bits; offset += element_bits) mask |= element << offset;
  *result = mask & width_mask(bits);
  return 1;
}

static uint64_t memory_bytes(void) {
  return cached_memory_bytes
    ? cached_memory_bytes
    : (uint64_t)__builtin_wasm_memory_size(0) * UINT64_C(65536);
}

static int address_is_valid(uint64_t address, uint32_t size) {
  uint64_t translated = (uint64_t)cpu.memory_bias + address;
  return translated <= memory_bytes() && size <= memory_bytes() - translated;
}

static uint8_t *guest_pointer(uint64_t address) {
  return (uint8_t *)(uintptr_t)((uint64_t)cpu.memory_bias + address);
}

static uint64_t read_register(uint32_t index, int use_sp) {
  if (index < 31) return cpu.x[index];
  return use_sp ? cpu.sp : 0;
}

static void write_register(uint32_t index, uint64_t value, int is_64, int use_sp) {
  if (!is_64) value = (uint32_t)value;
  if (index < 31) {
    cpu.x[index] = value;
    if (diagnostics_enabled) {
      register_write_pc[index] = cpu.pc >= 4 ? cpu.pc - 4 : 0;
    }
    if (diagnostics_enabled && value == 60) {
      uint32_t slot = value_60_write_index++ & 63;
      value_60_write_pc[slot] = register_write_pc[index];
      value_60_write_register[slot] = index;
      if (index == 28 && !first_x28_value_60_write_pc) first_x28_value_60_write_pc = register_write_pc[index];
    }
  }
  else if (use_sp) cpu.sp = value;
}

static uint64_t load_integer(uint64_t address, uint32_t size) {
  uint8_t *p = guest_pointer(address);
  uint64_t value = 0;
  for (uint32_t index = 0; index < size; index++) value |= (uint64_t)p[index] << (index * 8);
  if (watchpoint_loads && watchpoint_address && address < watchpoint_address + watchpoint_length && watchpoint_address < address + size) {
    watchpoint_store_address = address;
    watchpoint_value = value;
    watchpoint_size = size;
    watchpoint_address = 0;
    cpu.status = ARM64_STATUS_WATCHPOINT;
    cpu.fault_address = cpu.pc >= 4 ? cpu.pc - 4 : 0;
  }
  return value;
}

static void store_integer(uint64_t address, uint64_t value, uint32_t size) {
  uint8_t *p = guest_pointer(address);
  for (uint32_t index = 0; index < size; index++) p[index] = (uint8_t)(value >> (index * 8));
  if (!watchpoint_loads && watchpoint_address && address < watchpoint_address + watchpoint_length && watchpoint_address < address + size) {
    watchpoint_store_address = address;
    watchpoint_value = value;
    watchpoint_size = size;
    watchpoint_address = 0;
    cpu.status = ARM64_STATUS_WATCHPOINT;
    cpu.fault_address = cpu.pc >= 4 ? cpu.pc - 4 : 0;
  }
}

static int32_t fail(int32_t status, uint64_t address) {
  cpu.status = status;
  cpu.fault_address = address;
  return status;
}

/*
 * The protected startup stream is overwhelmingly ordinary integer control
 * flow and memory traffic. Keep its most common exact instruction families
 * ahead of the much larger FP/NEON decoder so they do not traverse hundreds
 * of unrelated masks on every guest step. The full handlers remain below as
 * the canonical fallback for all less common forms.
 */
static int fast_integer_step(uint32_t instruction, uint64_t instruction_pc) {
  uint32_t wide_class = instruction & UINT32_C(0x7f800000);
  if (wide_class == UINT32_C(0x12800000) || wide_class == UINT32_C(0x52800000) || wide_class == UINT32_C(0x72800000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t halfword = (instruction >> 21) & 3;
    uint32_t shift = halfword * 16;
    uint32_t rd = instruction & 31;
    if (!is_64 && halfword > 1) { fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc); return 1; }
    uint64_t immediate = (uint64_t)((instruction >> 5) & 0xffff) << shift;
    uint64_t value;
    if (wide_class == UINT32_C(0x12800000)) value = ~immediate;
    else if (wide_class == UINT32_C(0x52800000)) value = immediate;
    else {
      uint64_t mask = UINT64_C(0xffff) << shift;
      value = (read_register(rd, 0) & ~mask) | immediate;
    }
    write_register(rd, value, is_64, 0);
    return 1;
  }

  uint32_t adr_class = instruction & UINT32_C(0x9f000000);
  if (adr_class == UINT32_C(0x10000000) || adr_class == UINT32_C(0x90000000)) {
    uint64_t immediate = ((uint64_t)((instruction >> 5) & 0x7ffff) << 2) | ((instruction >> 29) & 3);
    uint32_t rd = instruction & 31;
    if (adr_class == UINT32_C(0x90000000)) {
      immediate = sign_extend(immediate, 21) << 12;
      write_register(rd, (instruction_pc & ~UINT64_C(0xfff)) + immediate, 1, 0);
    } else {
      write_register(rd, instruction_pc + sign_extend(immediate, 21), 1, 0);
    }
    return 1;
  }

  uint32_t branch_class = instruction & UINT32_C(0xfc000000);
  if (branch_class == UINT32_C(0x14000000) || branch_class == UINT32_C(0x94000000)) {
    uint64_t target = instruction_pc + (sign_extend(instruction & UINT32_C(0x03ffffff), 26) << 2);
    if (branch_class == UINT32_C(0x94000000)) {
      record_call(instruction_pc, target);
      cpu.x[30] = cpu.pc;
    }
    cpu.pc = target;
    return 1;
  }

  if ((instruction & UINT32_C(0xff000010)) == UINT32_C(0x54000000)) {
    uint64_t offset = sign_extend((instruction >> 5) & 0x7ffff, 19) << 2;
    if (condition_holds(instruction & 15)) cpu.pc = instruction_pc + offset;
    return 1;
  }

  if ((instruction & UINT32_C(0x7e000000)) == UINT32_C(0x34000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t nonzero = (instruction >> 24) & 1;
    uint64_t value = read_register(instruction & 31, 0) & width_mask(is_64 ? 64 : 32);
    uint64_t offset = sign_extend((instruction >> 5) & 0x7ffff, 19) << 2;
    if ((value != 0) == nonzero) cpu.pc = instruction_pc + offset;
    return 1;
  }

  if ((instruction & UINT32_C(0x7e000000)) == UINT32_C(0x36000000)) {
    uint32_t nonzero = (instruction >> 24) & 1;
    uint32_t bit = ((instruction >> 26) & 0x20) | ((instruction >> 19) & 0x1f);
    uint64_t offset = sign_extend((instruction >> 5) & 0x3fff, 14) << 2;
    if ((((read_register(instruction & 31, 0) >> bit) & 1) != 0) == nonzero) cpu.pc = instruction_pc + offset;
    return 1;
  }

  uint32_t register_branch = instruction & UINT32_C(0xfffffc1f);
  if (register_branch == UINT32_C(0xd61f0000) || register_branch == UINT32_C(0xd63f0000) || register_branch == UINT32_C(0xd65f0000)) {
    uint64_t target = read_register((instruction >> 5) & 31, 0);
    if (register_branch == UINT32_C(0xd63f0000)) {
      record_call(instruction_pc, target);
      cpu.x[30] = cpu.pc;
    }
    if (register_branch == UINT32_C(0xd65f0000) && target == UINT64_MAX) cpu.status = ARM64_STATUS_HALTED;
    else cpu.pc = target;
    return 1;
  }

  if ((instruction & UINT32_C(0x1f000000)) == UINT32_C(0x11000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t subtract = (instruction >> 30) & 1;
    uint32_t set_flags = (instruction >> 29) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t immediate = (instruction >> 10) & 0xfff;
    if ((instruction >> 22) & 1) immediate <<= 12;
    uint64_t left = read_register(rn, 1);
    uint64_t result = subtract ? left - immediate : left + immediate;
    if (set_flags) set_add_sub_flags(left, immediate, result, is_64 ? 64 : 32, subtract);
    write_register(rd, result, is_64, set_flags ? 0 : 1);
    return 1;
  }

  /* Integer load/store with unsigned scaled immediate. */
  if (((instruction >> 26) & 1) == 0 && (instruction & UINT32_C(0x3b000000)) == UINT32_C(0x39000000)) {
    uint32_t size_log2 = instruction >> 30;
    uint32_t size = 1u << size_log2;
    uint32_t operation = (instruction >> 22) & 3;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    uint64_t address = read_register(rn, 1) + (uint64_t)((instruction >> 10) & 0xfff) * size;
    if (!address_is_valid(address, size)) { fail(ARM64_FAULT_MEMORY, address); return 1; }
    if (operation == 0) store_integer(address, read_register(rt, 0), size);
    else if (operation == 1) write_register(rt, load_integer(address, size), size == 8, 0);
    else {
      if (size == 8 || (operation == 3 && size >= 4)) { fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc); return 1; }
      write_register(rt, sign_extend(load_integer(address, size), size * 8), operation == 2, 0);
    }
    return 1;
  }

  /* Integer load/store with unscaled, unprivileged, pre-index or post-index immediate. */
  if (((instruction >> 26) & 1) == 0 && (instruction & UINT32_C(0x3b200000)) == UINT32_C(0x38000000)) {
    uint32_t size_log2 = instruction >> 30;
    uint32_t size = 1u << size_log2;
    uint32_t operation = (instruction >> 22) & 3;
    int64_t offset = (int64_t)sign_extend((instruction >> 12) & 0x1ff, 9);
    uint32_t mode = (instruction >> 10) & 3;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    uint64_t base = read_register(rn, 1);
    uint64_t address = mode == 1 ? base : base + offset;
    if (!address_is_valid(address, size)) { fail(ARM64_FAULT_MEMORY, address); return 1; }
    if (operation == 0) store_integer(address, read_register(rt, 0), size);
    else if (operation == 1) write_register(rt, load_integer(address, size), size == 8, 0);
    else {
      if (size == 8 || (operation == 3 && size >= 4)) { fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc); return 1; }
      write_register(rt, sign_extend(load_integer(address, size), size * 8), operation == 2, 0);
    }
    if (mode == 1 || mode == 3) write_register(rn, base + offset, 1, 1);
    return 1;
  }

  /* LDP/STP offset, pre-index and post-index forms for integer registers. */
  if ((instruction & UINT32_C(0x3a000000)) == UINT32_C(0x28000000) && ((instruction >> 26) & 1) == 0) {
    uint32_t opc = instruction >> 30;
    uint32_t signed_words = opc == 1;
    uint32_t size = opc == 2 ? 8 : (opc == 0 || signed_words) ? 4 : 0;
    uint32_t mode = (instruction >> 23) & 3;
    uint32_t load = (instruction >> 22) & 1;
    uint32_t rt2 = (instruction >> 10) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    if (size == 0 || mode == 0 || (signed_words && !load)) { fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc); return 1; }
    int64_t offset = (int64_t)sign_extend((instruction >> 15) & 0x7f, 7) * size;
    uint64_t base = read_register(rn, 1);
    uint64_t address = mode == 1 ? base : base + offset;
    if (!address_is_valid(address, size * 2)) { fail(ARM64_FAULT_MEMORY, address); return 1; }
    if (load) {
      uint64_t first = load_integer(address, size);
      uint64_t second = load_integer(address + size, size);
      write_register(rt, signed_words ? sign_extend(first, 32) : first, size == 8 || signed_words, 0);
      write_register(rt2, signed_words ? sign_extend(second, 32) : second, size == 8 || signed_words, 0);
    } else {
      store_integer(address, read_register(rt, 0), size);
      store_integer(address + size, read_register(rt2, 0), size);
    }
    if (mode == 1 || mode == 3) write_register(rn, base + offset, 1, 1);
    return 1;
  }

  return 0;
}

__attribute__((export_name("arm64_reset")))
void arm64_reset(uint64_t pc) {
  for (uint32_t index = 0; index < 31; index++) {
    cpu.x[index] = 0;
    register_write_pc[index] = 0;
  }
  for (uint32_t index = 0; index < 32; index++) cpu.q_lo[index] = cpu.q_hi[index] = 0;
  cpu.sp = 0;
  cpu.pc = pc;
  cpu.steps = 0;
  cpu.nzcv = 0;
  cpu.last_instruction = 0;
  cpu.status = ARM64_STATUS_RUNNING;
  cpu.fault_address = 0;
  recent_call_index = 0;
  value_60_write_index = 0;
  first_x28_value_60_write_pc = 0;
  tracepoint_pc = 0;
  module_trace_enabled = 0;
  watchpoint_address = 0;
  watchpoint_store_address = 0;
  watchpoint_value = 0;
  watchpoint_size = 0;
  watchpoint_loads = 0;
  watchpoint_length = 4;
  callback_depth = 0;
}

__attribute__((export_name("arm64_set_tracepoint")))
void arm64_set_tracepoint(uint64_t pc) { tracepoint_pc = pc; }

__attribute__((export_name("arm64_set_module_trace")))
void arm64_set_module_trace(uint32_t enabled) { module_trace_enabled = enabled; }

__attribute__((export_name("arm64_set_watchpoint")))
void arm64_set_watchpoint(uint64_t address) {
  watchpoint_address = address;
  watchpoint_loads = 0;
  watchpoint_length = 4;
}

__attribute__((export_name("arm64_set_watchpoint_range")))
void arm64_set_watchpoint_range(uint64_t address, uint64_t length) {
  watchpoint_address = address;
  watchpoint_loads = 0;
  watchpoint_length = length ? length : 1;
}

__attribute__((export_name("arm64_set_read_watchpoint")))
void arm64_set_read_watchpoint(uint64_t address) {
  watchpoint_address = address;
  watchpoint_loads = 1;
  watchpoint_length = 4;
}

__attribute__((export_name("arm64_set_read_watchpoint_range")))
void arm64_set_read_watchpoint_range(uint64_t address, uint64_t length) {
  watchpoint_address = address;
  watchpoint_loads = 1;
  watchpoint_length = length ? length : 1;
}

__attribute__((export_name("arm64_get_watchpoint_store_address")))
uint64_t arm64_get_watchpoint_store_address(void) { return watchpoint_store_address; }

__attribute__((export_name("arm64_get_watchpoint_value")))
uint64_t arm64_get_watchpoint_value(void) { return watchpoint_value; }

__attribute__((export_name("arm64_get_watchpoint_size")))
uint32_t arm64_get_watchpoint_size(void) { return watchpoint_size; }

__attribute__((export_name("arm64_get_watchpoint_is_load")))
uint32_t arm64_get_watchpoint_is_load(void) { return watchpoint_loads; }

__attribute__((export_name("arm64_set_memory_bias")))
void arm64_set_memory_bias(uint32_t bias) { cpu.memory_bias = bias; }

__attribute__((export_name("arm64_set_memory_bytes")))
void arm64_set_memory_bytes(uint64_t bytes) { cached_memory_bytes = bytes; }

__attribute__((export_name("arm64_set_register")))
void arm64_set_register(uint32_t index, uint64_t value) {
  if (index < 31) cpu.x[index] = value;
}

__attribute__((export_name("arm64_get_register")))
uint64_t arm64_get_register(uint32_t index) {
  return index < 31 ? cpu.x[index] : 0;
}

__attribute__((export_name("arm64_get_vector_lo")))
uint64_t arm64_get_vector_lo(uint32_t index) { return index < 32 ? cpu.q_lo[index] : 0; }

__attribute__((export_name("arm64_get_vector_hi")))
uint64_t arm64_get_vector_hi(uint32_t index) { return index < 32 ? cpu.q_hi[index] : 0; }

__attribute__((export_name("arm64_set_vector_lo")))
void arm64_set_vector_lo(uint32_t index, uint64_t value) { if (index < 32) cpu.q_lo[index] = value; }

__attribute__((export_name("arm64_set_vector_hi")))
void arm64_set_vector_hi(uint32_t index, uint64_t value) { if (index < 32) cpu.q_hi[index] = value; }

__attribute__((export_name("arm64_set_sp")))
void arm64_set_sp(uint64_t value) { cpu.sp = value; }

__attribute__((export_name("arm64_get_sp")))
uint64_t arm64_get_sp(void) { return cpu.sp; }

__attribute__((export_name("arm64_get_pc")))
uint64_t arm64_get_pc(void) { return cpu.pc; }

__attribute__((export_name("arm64_get_steps")))
uint64_t arm64_get_steps(void) { return cpu.steps; }

__attribute__((export_name("arm64_get_status")))
int32_t arm64_get_status(void) { return cpu.status; }

__attribute__((export_name("arm64_get_last_instruction")))
uint32_t arm64_get_last_instruction(void) { return cpu.last_instruction; }

__attribute__((export_name("arm64_get_fault_address")))
uint64_t arm64_get_fault_address(void) { return cpu.fault_address; }

__attribute__((export_name("arm64_get_recent_call_pc")))
uint64_t arm64_get_recent_call_pc(uint32_t age) {
  return age < ARM64_RECENT_CALLS && age < recent_call_index ? recent_call_pc[(recent_call_index - 1 - age) & (ARM64_RECENT_CALLS - 1)] : 0;
}

__attribute__((export_name("arm64_get_recent_call_target")))
uint64_t arm64_get_recent_call_target(uint32_t age) {
  return age < ARM64_RECENT_CALLS && age < recent_call_index ? recent_call_target[(recent_call_index - 1 - age) & (ARM64_RECENT_CALLS - 1)] : 0;
}

__attribute__((export_name("arm64_get_register_write_pc")))
uint64_t arm64_get_register_write_pc(uint32_t index) { return index < 31 ? register_write_pc[index] : 0; }

__attribute__((export_name("arm64_get_recent_value_60_write_pc")))
uint64_t arm64_get_recent_value_60_write_pc(uint32_t age) {
  return age < 64 && age < value_60_write_index ? value_60_write_pc[(value_60_write_index - 1 - age) & 63] : 0;
}

__attribute__((export_name("arm64_get_recent_value_60_write_register")))
uint32_t arm64_get_recent_value_60_write_register(uint32_t age) {
  return age < 64 && age < value_60_write_index ? value_60_write_register[(value_60_write_index - 1 - age) & 63] : 0;
}

__attribute__((export_name("arm64_get_first_x28_value_60_write_pc")))
uint64_t arm64_get_first_x28_value_60_write_pc(void) { return first_x28_value_60_write_pc; }

__attribute__((export_name("arm64_set_diagnostics")))
void arm64_set_diagnostics(uint32_t enabled) { diagnostics_enabled = enabled != 0; }

__attribute__((export_name("arm64_resume")))
void arm64_resume(void) {
  if (cpu.status == ARM64_STATUS_SYSCALL || cpu.status == ARM64_STATUS_HOSTCALL ||
      cpu.status == ARM64_STATUS_TRACEPOINT || cpu.status == ARM64_STATUS_WATCHPOINT) cpu.status = ARM64_STATUS_RUNNING;
}

/* Diagnostic escape hatch: continue after a decoded fault at the next PC. */
__attribute__((export_name("arm64_skip_fault")))
void arm64_skip_fault(void) {
  if (cpu.status < ARM64_STATUS_RUNNING) {
    cpu.status = ARM64_STATUS_RUNNING;
    cpu.fault_address = 0;
  }
}

__attribute__((export_name("arm64_begin_callback")))
int32_t arm64_begin_callback(uint64_t pc,
                             uint64_t argument0, uint64_t argument1, uint64_t argument2, uint64_t argument3,
                             uint64_t argument4, uint64_t argument5, uint64_t argument6, uint64_t argument7) {
  if (callback_depth >= ARM64_CALLBACK_DEPTH) return 0;
  copy_cpu_state(&callback_parent_cpu[callback_depth], &cpu);
  callback_depth++;
  cpu.pc = pc;
  cpu.x[0] = argument0;
  cpu.x[1] = argument1;
  cpu.x[2] = argument2;
  cpu.x[3] = argument3;
  cpu.x[4] = argument4;
  cpu.x[5] = argument5;
  cpu.x[6] = argument6;
  cpu.x[7] = argument7;
  cpu.x[30] = UINT64_MAX;
  cpu.status = ARM64_STATUS_RUNNING;
  cpu.fault_address = 0;
  return 1;
}

__attribute__((export_name("arm64_end_callback")))
uint64_t arm64_end_callback(void) {
  if (!callback_depth) return 0;
  uint64_t result = cpu.x[0];
  Arm64State *parent = &callback_parent_cpu[callback_depth - 1];
  uint64_t callback_steps = cpu.steps - parent->steps;
  copy_cpu_state(&cpu, parent);
  cpu.steps += callback_steps;
  callback_depth--;
  return result;
}

__attribute__((export_name("arm64_suspend_callback")))
int32_t arm64_suspend_callback(uint32_t slot) {
  if (!callback_depth || slot >= ARM64_SUSPENDED_CONTEXTS) return 0;
  copy_cpu_state(&suspended_contexts[slot], &cpu);
  suspended_context_active[slot] = 1;
  Arm64State *parent = &callback_parent_cpu[callback_depth - 1];
  uint64_t callback_steps = cpu.steps - parent->steps;
  copy_cpu_state(&cpu, parent);
  cpu.steps += callback_steps;
  callback_depth--;
  return 1;
}

__attribute__((export_name("arm64_resume_callback")))
int32_t arm64_resume_callback(uint32_t slot) {
  if (callback_depth >= ARM64_CALLBACK_DEPTH || slot >= ARM64_SUSPENDED_CONTEXTS || !suspended_context_active[slot]) return 0;
  uint64_t current_steps = cpu.steps;
  copy_cpu_state(&callback_parent_cpu[callback_depth], &cpu);
  callback_depth++;
  copy_cpu_state(&cpu, &suspended_contexts[slot]);
  cpu.steps = current_steps;
  cpu.status = ARM64_STATUS_RUNNING;
  cpu.fault_address = 0;
  return 1;
}

__attribute__((export_name("arm64_discard_suspended_callback")))
void arm64_discard_suspended_callback(uint32_t slot) {
  if (slot < ARM64_SUSPENDED_CONTEXTS) suspended_context_active[slot] = 0;
}

__attribute__((export_name("arm64_terminate_callback")))
int32_t arm64_terminate_callback(uint64_t result) {
  if (!callback_depth) return 0;
  cpu.x[0] = result;
  cpu.pc = UINT64_MAX;
  cpu.status = ARM64_STATUS_HALTED;
  cpu.fault_address = 0;
  return 1;
}

__attribute__((export_name("arm64_halt")))
void arm64_halt(uint64_t result) {
  cpu.x[0] = result;
  cpu.pc = UINT64_MAX;
  cpu.status = ARM64_STATUS_HALTED;
  cpu.fault_address = 0;
}

__attribute__((export_name("arm64_step")))
int32_t arm64_step(void) {
  if (cpu.status != ARM64_STATUS_RUNNING) return cpu.status;
  if (tracepoint_pc && cpu.pc == tracepoint_pc) {
    tracepoint_pc = 0;
    cpu.status = ARM64_STATUS_TRACEPOINT;
    cpu.fault_address = cpu.pc;
    return cpu.status;
  }
  if ((cpu.pc & 3) != 0) return fail(ARM64_FAULT_ALIGNMENT, cpu.pc);
  if (!address_is_valid(cpu.pc, 4)) return fail(ARM64_FAULT_MEMORY, cpu.pc);

  uint64_t instruction_pc = cpu.pc;
  uint32_t instruction = (uint32_t)load_integer(instruction_pc, 4);
  if (module_trace_enabled && instruction == 0xd63f00c0u &&
      cpu.x[1] <= 0xffff && cpu.x[2] < UINT32_MAX &&
      cpu.x[3] >= 0x1000 && cpu.x[3] <= 0x1000000 &&
      cpu.x[6] >= cpu.x[2] && cpu.x[6] < cpu.x[2] + cpu.x[3]) {
    module_trace_enabled = 0;
    cpu.status = ARM64_STATUS_TRACEPOINT;
    cpu.fault_address = cpu.pc;
    return cpu.status;
  }
  cpu.last_instruction = instruction;
  cpu.pc += 4;
  cpu.steps++;

  /* NOP and XPACLRI hint (guest return addresses are already untagged). */
  if (instruction == UINT32_C(0xd503201f) || instruction == UINT32_C(0xd50320ff)) return cpu.status;

  /* Architectural cache geometry. Model 64-byte data and instruction lines. */
  if (instruction == UINT32_C(0xd53b0020)) {
    cpu.x[0] = UINT64_C(0x00040004);
    return cpu.status;
  }

  /* TPIDR_EL0: stable browser-thread TLS base in the reserved host runtime. */
  if ((instruction & UINT32_C(0xffffffe0)) == UINT32_C(0xd53bd040)) {
    write_register(instruction & 31, UINT64_C(0x07d80000), 1, 0);
    return cpu.status;
  }

  /* Cache maintenance and barriers are coherent no-ops in WebAssembly memory. */
  if ((instruction & UINT32_C(0xffffffe0)) == UINT32_C(0xd50b7b20) ||
      (instruction & UINT32_C(0xffffffe0)) == UINT32_C(0xd50b7520) ||
      instruction == UINT32_C(0xd5033b9f) || instruction == UINT32_C(0xd5033fdf)) return cpu.status;

  if (fast_integer_step(instruction, instruction_pc)) return cpu.status;

  /* Bit-preserving FMOV between general-purpose and scalar FP registers. */
  uint32_t fmov_class = instruction & UINT32_C(0xfffffc00);
  if (fmov_class == UINT32_C(0x9e670000) || fmov_class == UINT32_C(0x1e270000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = read_register(rn, 0) & width_mask(is_64 ? 64 : 32);
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }
  if (fmov_class == UINT32_C(0x9e660000) || fmov_class == UINT32_C(0x1e260000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    write_register(rd, cpu.q_lo[rn], is_64, 0);
    return cpu.status;
  }

  /* UCVTF Sd, Wn: convert an unsigned 32-bit integer to IEEE-754 single. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e230000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } converted;
    converted.number = (float)(uint32_t)read_register(rn, 0);
    cpu.q_lo[rd] = converted.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* SCVTF Sd, Wn: convert a signed 32-bit integer to IEEE-754 single. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e220000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } converted;
    converted.number = (float)(int32_t)read_register(rn, 0);
    cpu.q_lo[rd] = converted.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* SCVTF Dd, Xn: signed 64-bit integer to IEEE-754 double. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x9e620000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { double number; uint64_t bits; } converted;
    converted.number = (double)(int64_t)read_register(rn, 0);
    cpu.q_lo[rd] = converted.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* Advanced SIMD scalar SCVTF Sd, Sn. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x5e21d800)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } converted;
    converted.number = (float)(int32_t)cpu.q_lo[rn];
    cpu.q_lo[rd] = converted.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* Advanced SIMD scalar SCVTF Dd, Dn. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x5e61d800)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { double number; uint64_t bits; } converted;
    converted.number = (double)(int64_t)cpu.q_lo[rn];
    cpu.q_lo[rd] = converted.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* Advanced SIMD scalar UCVTF Sd, Sn. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x7e21d800)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } converted;
    converted.number = (float)(uint32_t)cpu.q_lo[rn];
    cpu.q_lo[rd] = converted.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* FCVTZS Wd, Sn: truncate a scalar single toward zero to signed int32. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e380000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } source;
    source.bits = (uint32_t)cpu.q_lo[rn];
    write_register(rd, (uint32_t)(int32_t)source.number, 0, 0);
    return cpu.status;
  }

  /* FCVTZS Xd, Sn and SCVTF Sd, Xn. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x9e380000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } source;
    source.bits = (uint32_t)cpu.q_lo[rn];
    write_register(rd, (uint64_t)(int64_t)source.number, 1, 0);
    return cpu.status;
  }
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x9e220000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } destination;
    destination.number = (float)(int64_t)read_register(rn, 0);
    cpu.q_lo[rd] = destination.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* FMOV Sd, #imm: scalar form of the architectural 8-bit FP literal. */
  if ((instruction & UINT32_C(0xffe01fe0)) == UINT32_C(0x1e201000)) {
    uint32_t rd = instruction & 31;
    uint32_t immediate = (instruction >> 13) & 0xff;
    uint32_t b = (immediate >> 6) & 1;
    uint32_t exponent = ((b ^ 1) << 7) | (b ? 0x7c : 0) | ((immediate >> 4) & 3);
    uint32_t lane = ((immediate >> 7) << 31) | (exponent << 23) | ((immediate & 15) << 19);
    cpu.q_lo[rd] = lane;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* FMOV Dd, #imm: double-precision form of the FP literal. */
  if ((instruction & UINT32_C(0xffe01fe0)) == UINT32_C(0x1e601000)) {
    uint32_t rd = instruction & 31;
    uint32_t immediate = (instruction >> 13) & 0xff;
    uint32_t b = (immediate >> 6) & 1;
    uint64_t exponent = ((uint64_t)(b ^ 1) << 10) | (b ? UINT64_C(0x3fc) : 0) | ((immediate >> 4) & 3);
    uint64_t lane = ((uint64_t)(immediate >> 7) << 63) | (exponent << 52) | ((uint64_t)(immediate & 15) << 48);
    cpu.q_lo[rd] = lane;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* Scalar single-precision FMUL/FDIV/FADD/FSUB. */
  uint32_t fp_binary_class = instruction & UINT32_C(0xffe0fc00);
  if (fp_binary_class == UINT32_C(0x1e200800) || fp_binary_class == UINT32_C(0x1e201800) ||
      fp_binary_class == UINT32_C(0x1e202800) || fp_binary_class == UINT32_C(0x1e203800)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } left, right, output;
    left.bits = (uint32_t)cpu.q_lo[rn];
    right.bits = (uint32_t)cpu.q_lo[rm];
    if (fp_binary_class == UINT32_C(0x1e200800)) output.number = left.number * right.number;
    else if (fp_binary_class == UINT32_C(0x1e201800)) output.number = left.number / right.number;
    else if (fp_binary_class == UINT32_C(0x1e202800)) output.number = left.number + right.number;
    else output.number = left.number - right.number;
    cpu.q_lo[rd] = output.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* Scalar double-precision FMUL/FDIV/FADD/FSUB. */
  if (fp_binary_class == UINT32_C(0x1e600800) || fp_binary_class == UINT32_C(0x1e601800) ||
      fp_binary_class == UINT32_C(0x1e602800) || fp_binary_class == UINT32_C(0x1e603800)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { double number; uint64_t bits; } left, right, output;
    left.bits = cpu.q_lo[rn];
    right.bits = cpu.q_lo[rm];
    if (fp_binary_class == UINT32_C(0x1e600800)) output.number = left.number * right.number;
    else if (fp_binary_class == UINT32_C(0x1e601800)) output.number = left.number / right.number;
    else if (fp_binary_class == UINT32_C(0x1e602800)) output.number = left.number + right.number;
    else output.number = left.number - right.number;
    cpu.q_lo[rd] = output.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* Scalar FABS/FNEG preserve every payload bit except the sign bit. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e20c000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = (uint32_t)cpu.q_lo[rn] & UINT32_C(0x7fffffff);
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e60c000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = cpu.q_lo[rn] & UINT64_C(0x7fffffffffffffff);
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e214000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = (uint32_t)cpu.q_lo[rn] ^ UINT32_C(0x80000000);
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e614000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = cpu.q_lo[rn] ^ UINT64_C(0x8000000000000000);
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* FCVTZU Wd, Dn: truncate double to uint32. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e790000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { double number; uint64_t bits; } source;
    source.bits = cpu.q_lo[rn];
    write_register(rd, (uint32_t)source.number, 0, 0);
    return cpu.status;
  }

  /* FCMP Sn, #0.0: populate NZCV using the architectural FP comparison map. */
  if ((instruction & UINT32_C(0xfffffc1f)) == UINT32_C(0x1e202008)) {
    uint32_t rn = (instruction >> 5) & 31;
    union { float number; uint32_t bits; } left;
    left.bits = (uint32_t)cpu.q_lo[rn];
    if (left.number != left.number) cpu.nzcv = UINT32_C(0x30000000); /* unordered */
    else if (left.number == 0.0f) cpu.nzcv = UINT32_C(0x60000000);
    else if (left.number < 0.0f) cpu.nzcv = UINT32_C(0x80000000);
    else cpu.nzcv = UINT32_C(0x20000000);
    return cpu.status;
  }

  /* FCMP Sn, Sm. */
  if ((instruction & UINT32_C(0xffe0fc1f)) == UINT32_C(0x1e202000)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    union { float number; uint32_t bits; } left, right;
    left.bits = (uint32_t)cpu.q_lo[rn];
    right.bits = (uint32_t)cpu.q_lo[rm];
    if (left.number != left.number || right.number != right.number) cpu.nzcv = UINT32_C(0x30000000);
    else if (left.number == right.number) cpu.nzcv = UINT32_C(0x60000000);
    else if (left.number < right.number) cpu.nzcv = UINT32_C(0x80000000);
    else cpu.nzcv = UINT32_C(0x20000000);
    return cpu.status;
  }

  /* FCMP Dn, Dm. */
  if ((instruction & UINT32_C(0xffe0fc1f)) == UINT32_C(0x1e602000)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    union { double number; uint64_t bits; } left, right;
    left.bits = cpu.q_lo[rn];
    right.bits = cpu.q_lo[rm];
    if (left.number != left.number || right.number != right.number) cpu.nzcv = UINT32_C(0x30000000);
    else if (left.number == right.number) cpu.nzcv = UINT32_C(0x60000000);
    else if (left.number < right.number) cpu.nzcv = UINT32_C(0x80000000);
    else cpu.nzcv = UINT32_C(0x20000000);
    return cpu.status;
  }

  /* FCVTZU Wd, Sn, #fbits: scale then truncate toward zero. */
  if ((instruction & UINT32_C(0xffff0000)) == UINT32_C(0x1e190000)) {
    uint32_t scale = (instruction >> 10) & 0x3f;
    uint32_t fractional_bits = 64 - scale;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } source;
    source.bits = (uint32_t)cpu.q_lo[rn];
    double scaled = (double)source.number * (double)(UINT64_C(1) << fractional_bits);
    write_register(rd, (uint32_t)scaled, 0, 0);
    return cpu.status;
  }

  /* FCVT Dd, Sn and FCVT Sd, Dn: scalar single/double conversion. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e22c000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } source;
    union { double number; uint64_t bits; } destination;
    source.bits = (uint32_t)cpu.q_lo[rn];
    destination.number = (double)source.number;
    cpu.q_lo[rd] = destination.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x1e624000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { double number; uint64_t bits; } source;
    union { float number; uint32_t bits; } destination;
    source.bits = cpu.q_lo[rn];
    destination.number = (float)source.number;
    cpu.q_lo[rd] = destination.bits;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* FCSEL Sd, Sn, Sm, condition. */
  if ((instruction & UINT32_C(0xffe00c00)) == UINT32_C(0x1e200c00)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t condition = (instruction >> 12) & 15;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t source = condition_holds(condition) ? rn : rm;
    cpu.q_lo[rd] = (uint32_t)cpu.q_lo[source];
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /*
   * NEON MOVI/MVNI/ORR/BIC Vd.4H/8H/2S/4S, #imm8, optionally shifted within
   * each lane. Even cmode values replace the active lanes, with op selecting
   * MOVI or MVNI. Odd values update the destination with ORR or BIC. A 64-bit
   * vector write clears the inactive upper half like other Q=0 SIMD writes.
   */
  if ((instruction & UINT32_C(0x9ff80c00)) == UINT32_C(0x0f000400)) {
    uint32_t cmode = (instruction >> 12) & 15;
    if (cmode <= 11) {
      uint32_t rd = instruction & 31;
      uint32_t q = (instruction >> 30) & 1;
      uint32_t invert = (instruction >> 29) & 1;
      uint32_t immediate = ((instruction >> 5) & 0x1f) | ((instruction >> 11) & 0xe0);
      uint32_t element_bits = cmode < 8 ? 32 : 16;
      uint32_t shift = cmode < 8 ? (cmode >> 1) * 8 : ((cmode - 8) >> 1) * 8;
      uint64_t lane = (uint64_t)immediate << shift;
      if (invert && !(cmode & 1)) lane = (~lane) & width_mask(element_bits);
      uint64_t lanes = 0;
      for (uint32_t offset = 0; offset < 64; offset += element_bits) lanes |= lane << offset;
      if (cmode & 1) {
        cpu.q_lo[rd] = invert ? cpu.q_lo[rd] & ~lanes : cpu.q_lo[rd] | lanes;
        cpu.q_hi[rd] = q ? (invert ? cpu.q_hi[rd] & ~lanes : cpu.q_hi[rd] | lanes) : 0;
      } else {
        cpu.q_lo[rd] = lanes;
        cpu.q_hi[rd] = q ? lanes : 0;
      }
      return cpu.status;
    }
  }

  /* NEON MOVI Vd.2S/4S, #imm8: replicate into the active 32-bit lanes. */
  if ((instruction & UINT32_C(0xbff8fc00)) == UINT32_C(0x0f000400)) {
    uint32_t rd = instruction & 31;
    uint32_t q = (instruction >> 30) & 1;
    uint64_t immediate = ((instruction >> 5) & 0x1f) | ((instruction >> 11) & 0xe0);
    uint64_t lanes = immediate | (immediate << 32);
    cpu.q_lo[rd] = lanes;
    cpu.q_hi[rd] = q ? lanes : 0;
    return cpu.status;
  }

  /* NEON MVNI Vd.2S/4S, #imm8, MSL #16. */
  if ((instruction & UINT32_C(0xbff8fc00)) == UINT32_C(0x2f00d400)) {
    uint32_t rd = instruction & 31;
    uint32_t q = (instruction >> 30) & 1;
    uint32_t immediate = ((instruction >> 5) & 0x1f) | ((instruction >> 11) & 0xe0);
    uint32_t lane = ~((immediate << 16) | UINT32_C(0xffff));
    uint64_t lanes = lane | ((uint64_t)lane << 32);
    cpu.q_lo[rd] = lanes;
    cpu.q_hi[rd] = q ? lanes : 0;
    return cpu.status;
  }

  /* NEON MOVI Vd.2S/4S, #imm8, MSL #16. */
  if ((instruction & UINT32_C(0xbff8fc00)) == UINT32_C(0x0f00d400)) {
    uint32_t rd = instruction & 31;
    uint32_t q = (instruction >> 30) & 1;
    uint32_t immediate = ((instruction >> 5) & 0x1f) | ((instruction >> 11) & 0xe0);
    uint32_t lane = (immediate << 16) | UINT32_C(0xffff);
    uint64_t lanes = lane | ((uint64_t)lane << 32);
    cpu.q_lo[rd] = lanes;
    cpu.q_hi[rd] = q ? lanes : 0;
    return cpu.status;
  }

  /*
   * NEON MOVI Dd/Vd.2D byte-mask form. Each bit in imm8 expands to an
   * all-zero or all-one byte; Q chooses a 64- or 128-bit destination.
   */
  if ((instruction & UINT32_C(0xbff8fc00)) == UINT32_C(0x2f00e400)) {
    uint32_t rd = instruction & 31;
    uint32_t q = (instruction >> 30) & 1;
    uint32_t immediate = ((instruction >> 5) & 0x1f) | ((instruction >> 11) & 0xe0);
    uint64_t mask = 0;
    for (uint32_t byte = 0; byte < 8; byte++) {
      if ((immediate >> byte) & 1) mask |= UINT64_C(0xff) << (byte * 8);
    }
    cpu.q_lo[rd] = mask;
    cpu.q_hi[rd] = q ? mask : 0;
    return cpu.status;
  }

  /* NEON MOVI Vd.8B/16B, #imm8: replicate one byte. */
  if ((instruction & UINT32_C(0xbff8fc00)) == UINT32_C(0x0f00e400)) {
    uint32_t rd = instruction & 31;
    uint32_t q = (instruction >> 30) & 1;
    uint64_t immediate = ((instruction >> 5) & 0x1f) | ((instruction >> 11) & 0xe0);
    uint64_t bytes = immediate * UINT64_C(0x0101010101010101);
    cpu.q_lo[rd] = bytes;
    cpu.q_hi[rd] = q ? bytes : 0;
    return cpu.status;
  }

  /* NEON FMOV Vd.2S/4S, #imm: expand the architectural 8-bit FP literal. */
  if ((instruction & UINT32_C(0xbff8fc00)) == UINT32_C(0x0f00f400)) {
    uint32_t rd = instruction & 31;
    uint32_t q = (instruction >> 30) & 1;
    uint32_t immediate = ((instruction >> 5) & 0x1f) | ((instruction >> 11) & 0xe0);
    uint32_t b = (immediate >> 6) & 1;
    uint32_t exponent = ((b ^ 1) << 7) | (b ? 0x7c : 0) | ((immediate >> 4) & 3);
    uint32_t lane = ((immediate >> 7) << 31) | (exponent << 23) | ((immediate & 15) << 19);
    uint64_t lanes = (uint64_t)lane | ((uint64_t)lane << 32);
    cpu.q_lo[rd] = lanes;
    cpu.q_hi[rd] = q ? lanes : 0;
    return cpu.status;
  }

  /* NEON REV64 Vd.2S/4S, Vn.2S/4S: reverse 32-bit elements per 64-bit lane. */
  if ((instruction & UINT32_C(0xbffffc00)) == UINT32_C(0x0ea00800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t low = cpu.q_lo[rn];
    uint64_t high = cpu.q_hi[rn];
    cpu.q_lo[rd] = (low << 32) | (low >> 32);
    cpu.q_hi[rd] = q ? (high << 32) | (high >> 32) : 0;
    return cpu.status;
  }

  /* NEON SCVTF Vd.2S/4S, Vn.2S/4S: signed int32 lanes to float32. */
  if ((instruction & UINT32_C(0xbffffc00)) == UINT32_C(0x0e21d800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    uint32_t lanes = q ? 4 : 2;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint64_t source_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint32_t offset = (lane & 1) * 32;
      union { float number; uint32_t bits; } converted;
      converted.number = (float)(int32_t)(source_half >> offset);
      if (lane < 2) output_low |= (uint64_t)converted.bits << offset;
      else output_high |= (uint64_t)converted.bits << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON UCVTF Vd.2S/4S, Vn.2S/4S: unsigned int32 lanes to float32. */
  if ((instruction & UINT32_C(0xbffffc00)) == UINT32_C(0x2e21d800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output[2] = { 0, 0 };
    for (uint32_t lane = 0; lane < (q ? 4u : 2u); lane++) {
      uint64_t source_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint32_t offset = (lane & 1) * 32;
      union { float number; uint32_t bits; } converted;
      converted.number = (float)(uint32_t)(source_half >> offset);
      output[lane >= 2] |= (uint64_t)converted.bits << offset;
    }
    cpu.q_lo[rd] = output[0];
    cpu.q_hi[rd] = output[1];
    return cpu.status;
  }

  /* NEON FCVTZS Vd.2S/4S, Vn.2S/4S: truncate float32 lanes to int32. */
  if ((instruction & UINT32_C(0xbffffc00)) == UINT32_C(0x0ea1b800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    uint32_t lanes = q ? 4 : 2;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint64_t source_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint32_t offset = (lane & 1) * 32;
      union { float number; uint32_t bits; } source;
      source.bits = (uint32_t)(source_half >> offset);
      uint32_t converted = (uint32_t)(int32_t)source.number;
      if (lane < 2) output_low |= (uint64_t)converted << offset;
      else output_high |= (uint64_t)converted << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON float32 lane-wise FADD, FSUB, FMUL and FDIV (2S/4S). */
  uint32_t neon_fp_binary_class = instruction & UINT32_C(0xbfe0fc00);
  if (neon_fp_binary_class == UINT32_C(0x0e20d400) ||
      neon_fp_binary_class == UINT32_C(0x0ea0d400) ||
      neon_fp_binary_class == UINT32_C(0x2e20dc00) ||
      neon_fp_binary_class == UINT32_C(0x2e20fc00)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    uint32_t lanes = q ? 4 : 2;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint64_t left_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint64_t right_half = lane < 2 ? cpu.q_lo[rm] : cpu.q_hi[rm];
      uint32_t offset = (lane & 1) * 32;
      union { float number; uint32_t bits; } left, right, output;
      left.bits = (uint32_t)(left_half >> offset);
      right.bits = (uint32_t)(right_half >> offset);
      if (neon_fp_binary_class == UINT32_C(0x0e20d400)) output.number = left.number + right.number;
      else if (neon_fp_binary_class == UINT32_C(0x0ea0d400)) output.number = left.number - right.number;
      else if (neon_fp_binary_class == UINT32_C(0x2e20dc00)) output.number = left.number * right.number;
      else output.number = left.number / right.number;
      if (lane < 2) output_low |= (uint64_t)output.bits << offset;
      else output_high |= (uint64_t)output.bits << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON FMUL Vd.2S/4S, Vn.2S/4S, Vm.S[lane]. */
  if ((instruction & UINT32_C(0xbf80fc00)) == UINT32_C(0x0f809000)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t lane_index = (instruction >> 21) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    union { float number; uint32_t bits; } multiplier;
    multiplier.bits = (uint32_t)(cpu.q_lo[rm] >> (lane_index * 32));
    uint64_t output[2] = { 0, 0 };
    for (uint32_t lane = 0; lane < (q ? 4u : 2u); lane++) {
      uint64_t source_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint32_t offset = (lane & 1) * 32;
      union { float number; uint32_t bits; } source, result;
      source.bits = (uint32_t)(source_half >> offset);
      result.number = source.number * multiplier.number;
      output[lane >= 2] |= (uint64_t)result.bits << offset;
    }
    cpu.q_lo[rd] = output[0];
    cpu.q_hi[rd] = output[1];
    return cpu.status;
  }

  /*
   * NEON DUP Vd.<T>, Wn/Xn: replicate a general-purpose register's low
   * element into every active vector lane. imm5's least-significant set bit
   * encodes the element width; Q selects a 64- or 128-bit destination.
   */
  if ((instruction & UINT32_C(0xbf20fc00)) == UINT32_C(0x0e000c00)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t imm5 = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t element_bits;
    if (imm5 & 1) element_bits = 8;
    else if (imm5 & 2) element_bits = 16;
    else if (imm5 & 4) element_bits = 32;
    else if ((imm5 & 8) && q) element_bits = 64;
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);

    uint64_t element = read_register(rn, 0) & width_mask(element_bits);
    uint64_t lanes = 0;
    for (uint32_t offset = 0; offset < 64; offset += element_bits) lanes |= element << offset;
    cpu.q_lo[rd] = lanes;
    cpu.q_hi[rd] = q ? lanes : 0;
    return cpu.status;
  }

  /* NEON DUP Vd.<T>, Vn.<T>[index]: replicate one source vector lane. */
  if ((instruction & UINT32_C(0xbf20fc00)) == UINT32_C(0x0e000400)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t imm5 = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t element_bits;
    uint32_t element_shift;
    if (imm5 & 1) { element_bits = 8; element_shift = 0; }
    else if (imm5 & 2) { element_bits = 16; element_shift = 1; }
    else if (imm5 & 4) { element_bits = 32; element_shift = 2; }
    else if ((imm5 & 8) && q) { element_bits = 64; element_shift = 3; }
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t lane = imm5 >> (element_shift + 1);
    uint32_t bit_offset = lane * element_bits;
    uint64_t source_half = bit_offset < 64 ? cpu.q_lo[rn] : cpu.q_hi[rn];
    uint64_t element = (source_half >> (bit_offset & 63)) & width_mask(element_bits);
    uint64_t replicated = 0;
    for (uint32_t offset = 0; offset < 64; offset += element_bits) replicated |= element << offset;
    cpu.q_lo[rd] = replicated;
    cpu.q_hi[rd] = q ? replicated : 0;
    return cpu.status;
  }

  /* Advanced SIMD scalar DUP: MOV Sd, Vn.S[index] and sibling widths. */
  if ((instruction & UINT32_C(0xff20fc00)) == UINT32_C(0x5e000400)) {
    uint32_t imm5 = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t element_bits;
    uint32_t element_shift;
    if (imm5 & 1) { element_bits = 8; element_shift = 0; }
    else if (imm5 & 2) { element_bits = 16; element_shift = 1; }
    else if (imm5 & 4) { element_bits = 32; element_shift = 2; }
    else if (imm5 & 8) { element_bits = 64; element_shift = 3; }
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t lane = imm5 >> (element_shift + 1);
    uint32_t bit_offset = lane * element_bits;
    uint64_t source_half = bit_offset < 64 ? cpu.q_lo[rn] : cpu.q_hi[rn];
    cpu.q_lo[rd] = (source_half >> (bit_offset & 63)) & width_mask(element_bits);
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /*
   * NEON EXT Vd.8B/16B, Vn, Vm, #index: concatenate the two active source
   * vectors and copy one vector-width window beginning at the byte index.
   */
  if ((instruction & UINT32_C(0xbfe08400)) == UINT32_C(0x2e000000)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t index = (instruction >> 11) & 15;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t vector_bytes = q ? 16 : 8;
    if (index >= vector_bytes) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t byte = 0; byte < vector_bytes; byte++) {
      uint32_t source_byte = index + byte;
      uint64_t source_half;
      uint32_t source_offset;
      if (source_byte < vector_bytes) {
        source_half = source_byte < 8 ? rn_lo : rn_hi;
        source_offset = source_byte & 7;
      } else {
        uint32_t rm_byte = source_byte - vector_bytes;
        source_half = rm_byte < 8 ? rm_lo : rm_hi;
        source_offset = rm_byte & 7;
      }
      uint64_t value = (source_half >> (source_offset * 8)) & UINT64_C(0xff);
      if (byte < 8) result_lo |= value << (byte * 8);
      else result_hi |= value << ((byte - 8) * 8);
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = q ? result_hi : 0;
    return cpu.status;
  }

  /* NEON signed/unsigned widening multiply-add/subtract, lower and *2 forms. */
  if ((instruction & UINT32_C(0x9f20dc00)) == UINT32_C(0x0e208000)) {
    uint32_t upper = (instruction >> 30) & 1;
    uint32_t is_unsigned = (instruction >> 29) & 1;
    uint32_t size = (instruction >> 22) & 3;
    uint32_t subtract = (instruction >> 13) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 3) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t source_bits = 8u << size;
    uint32_t destination_bits = source_bits * 2;
    uint32_t lanes = 128 / destination_bits;
    uint64_t source_mask = width_mask(source_bits);
    uint64_t destination_mask = width_mask(destination_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t rd_lo = cpu.q_lo[rd], rd_hi = cpu.q_hi[rd];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t source_lane = lane + (upper ? lanes : 0);
      uint32_t source_bit = source_lane * source_bits;
      uint64_t left_half = source_bit < 64 ? rn_lo : rn_hi;
      uint64_t right_half = source_bit < 64 ? rm_lo : rm_hi;
      uint32_t source_offset = source_bit & 63;
      uint64_t left_raw = (left_half >> source_offset) & source_mask;
      uint64_t right_raw = (right_half >> source_offset) & source_mask;
      uint64_t product = is_unsigned
        ? left_raw * right_raw
        : (uint64_t)((int64_t)sign_extend(left_raw, source_bits) * (int64_t)sign_extend(right_raw, source_bits));
      uint32_t destination_bit = lane * destination_bits;
      uint64_t accumulator_half = destination_bit < 64 ? rd_lo : rd_hi;
      uint32_t destination_offset = destination_bit & 63;
      uint64_t accumulator = (accumulator_half >> destination_offset) & destination_mask;
      uint64_t value = (subtract ? accumulator - product : accumulator + product) & destination_mask;
      if (destination_bit < 64) result_lo |= value << destination_offset;
      else result_hi |= value << destination_offset;
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = result_hi;
    return cpu.status;
  }

  /* NEON SMULL/UMULL and SMULL2/UMULL2 widening products. */
  if ((instruction & UINT32_C(0x9f20fc00)) == UINT32_C(0x0e20c000)) {
    uint32_t upper = (instruction >> 30) & 1;
    uint32_t is_unsigned = (instruction >> 29) & 1;
    uint32_t size = (instruction >> 22) & 3;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 3) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t source_bits = 8u << size;
    uint32_t destination_bits = source_bits * 2;
    uint32_t lanes = 128 / destination_bits;
    uint64_t source_mask = width_mask(source_bits);
    uint64_t destination_mask = width_mask(destination_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t source_bit = (lane + (upper ? lanes : 0)) * source_bits;
      uint64_t left_half = source_bit < 64 ? rn_lo : rn_hi;
      uint64_t right_half = source_bit < 64 ? rm_lo : rm_hi;
      uint64_t left_raw = (left_half >> (source_bit & 63)) & source_mask;
      uint64_t right_raw = (right_half >> (source_bit & 63)) & source_mask;
      uint64_t product = is_unsigned
        ? left_raw * right_raw
        : (uint64_t)((int64_t)sign_extend(left_raw, source_bits) * (int64_t)sign_extend(right_raw, source_bits));
      uint32_t destination_bit = lane * destination_bits;
      uint64_t value = product & destination_mask;
      if (destination_bit < 64) result_lo |= value << (destination_bit & 63);
      else result_hi |= value << (destination_bit & 63);
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = result_hi;
    return cpu.status;
  }

  /*
   * NEON S/UADDW and S/USUBW: add or subtract narrow lower/upper source
   * lanes from a full-width accumulator. Q selects the source half (the
   * *2 forms); U selects zero- rather than sign-extension.
   */
  if ((instruction & UINT32_C(0x9f20dc00)) == UINT32_C(0x0e201000)) {
    uint32_t upper = (instruction >> 30) & 1;
    uint32_t is_unsigned = (instruction >> 29) & 1;
    uint32_t size = (instruction >> 22) & 3;
    uint32_t subtract = (instruction >> 13) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 3) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t source_bits = 8u << size;
    uint32_t destination_bits = source_bits * 2;
    uint32_t lanes = 128 / destination_bits;
    uint64_t source_mask = width_mask(source_bits);
    uint64_t destination_mask = width_mask(destination_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t source_bit = (lane + (upper ? lanes : 0)) * source_bits;
      uint64_t source_half = source_bit < 64 ? rm_lo : rm_hi;
      uint64_t narrow = (source_half >> (source_bit & 63)) & source_mask;
      uint64_t widened = is_unsigned ? narrow : (uint64_t)sign_extend(narrow, source_bits);
      uint32_t destination_bit = lane * destination_bits;
      uint64_t accumulator_half = destination_bit < 64 ? rn_lo : rn_hi;
      uint64_t accumulator = (accumulator_half >> (destination_bit & 63)) & destination_mask;
      uint64_t value = (subtract ? accumulator - widened : accumulator + widened) & destination_mask;
      if (destination_bit < 64) result_lo |= value << (destination_bit & 63);
      else result_hi |= value << (destination_bit & 63);
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = result_hi;
    return cpu.status;
  }

  /* NEON SHRN/RSHRN and *2: optionally round, shift, and narrow. */
  if ((instruction & UINT32_C(0xbf80f400)) == UINT32_C(0x0f008400)) {
    uint32_t upper = (instruction >> 30) & 1;
    uint32_t round = (instruction >> 11) & 1;
    uint32_t encoded_immediate = (instruction >> 16) & 0x7f;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t source_bits;
    if (encoded_immediate >= 32) source_bits = 64;
    else if (encoded_immediate >= 16) source_bits = 32;
    else if (encoded_immediate >= 8) source_bits = 16;
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t shift = source_bits - encoded_immediate;
    uint32_t destination_bits = source_bits / 2;
    if (shift == 0 || shift > destination_bits) {
      return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    }
    uint32_t lanes = 128 / source_bits;
    uint64_t destination_mask = width_mask(destination_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t result = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t source_bit = lane * source_bits;
      uint64_t source_half = source_bit < 64 ? rn_lo : rn_hi;
      uint32_t source_offset = source_bit & 63;
      uint64_t source = source_half >> source_offset;
      if (round) source += UINT64_C(1) << (shift - 1);
      uint64_t value = (source >> shift) & destination_mask;
      result |= value << (lane * destination_bits);
    }
    if (upper) cpu.q_hi[rd] = result;
    else {
      cpu.q_lo[rd] = result;
      cpu.q_hi[rd] = 0;
    }
    return cpu.status;
  }

  /* NEON SQSHRN/SQSHRN2: signed arithmetic shift with signed saturation. */
  if ((instruction & UINT32_C(0xbf80fc00)) == UINT32_C(0x0f009400)) {
    uint32_t upper = (instruction >> 30) & 1;
    uint32_t encoded_immediate = (instruction >> 16) & 0x7f;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t source_bits;
    if (encoded_immediate >= 32) source_bits = 64;
    else if (encoded_immediate >= 16) source_bits = 32;
    else if (encoded_immediate >= 8) source_bits = 16;
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t shift = source_bits - encoded_immediate;
    uint32_t destination_bits = source_bits / 2;
    if (shift == 0 || shift > destination_bits) {
      return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    }
    uint32_t lanes = 128 / source_bits;
    uint64_t source_mask = width_mask(source_bits);
    uint64_t destination_mask = width_mask(destination_bits);
    int64_t destination_minimum = -(INT64_C(1) << (destination_bits - 1));
    int64_t destination_maximum = (INT64_C(1) << (destination_bits - 1)) - 1;
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t result = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t source_bit = lane * source_bits;
      uint64_t source_half = source_bit < 64 ? rn_lo : rn_hi;
      uint32_t source_offset = source_bit & 63;
      int64_t source = (int64_t)sign_extend((source_half >> source_offset) & source_mask, source_bits);
      int64_t shifted = (int64_t)arithmetic_shift_right((uint64_t)source, shift, 64);
      if (shifted < destination_minimum) shifted = destination_minimum;
      else if (shifted > destination_maximum) shifted = destination_maximum;
      result |= ((uint64_t)shifted & destination_mask) << (lane * destination_bits);
    }
    if (upper) cpu.q_hi[rd] = result;
    else {
      cpu.q_lo[rd] = result;
      cpu.q_hi[rd] = 0;
    }
    return cpu.status;
  }

  /* NEON SQXTUN/SQXTUN2: signed wide lanes saturated into unsigned narrow lanes. */
  if ((instruction & UINT32_C(0xbf3ffc00)) == UINT32_C(0x2e212800)) {
    uint32_t upper = (instruction >> 30) & 1;
    uint32_t size = (instruction >> 22) & 3;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 3) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t destination_bits = 8u << size;
    uint32_t source_bits = destination_bits * 2;
    uint32_t lanes = 128 / source_bits;
    uint64_t source_mask = width_mask(source_bits);
    uint64_t destination_mask = width_mask(destination_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t result = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t source_bit = lane * source_bits;
      uint64_t source_half = source_bit < 64 ? rn_lo : rn_hi;
      int64_t source = (int64_t)sign_extend(
        (source_half >> (source_bit & 63)) & source_mask, source_bits);
      uint64_t value = source <= 0 ? 0 : (uint64_t)source > destination_mask
        ? destination_mask : (uint64_t)source;
      result |= value << (lane * destination_bits);
    }
    if (upper) cpu.q_hi[rd] = result;
    else {
      cpu.q_lo[rd] = result;
      cpu.q_hi[rd] = 0;
    }
    return cpu.status;
  }

  /* NEON SHL by immediate across byte, halfword, word, and doubleword lanes. */
  if ((instruction & UINT32_C(0xbf80fc00)) == UINT32_C(0x0f005400)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t encoded_immediate = (instruction >> 16) & 0x7f;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t element_bits;
    if (encoded_immediate >= 64) element_bits = 64;
    else if (encoded_immediate >= 32) element_bits = 32;
    else if (encoded_immediate >= 16) element_bits = 16;
    else if (encoded_immediate >= 8) element_bits = 8;
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t shift = encoded_immediate - element_bits;
    uint32_t lanes = (q ? 128u : 64u) / element_bits;
    uint64_t element_mask = width_mask(element_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t bit = lane * element_bits;
      uint64_t source_half = bit < 64 ? rn_lo : rn_hi;
      uint32_t offset = bit & 63;
      uint64_t value = (((source_half >> offset) & element_mask) << shift) & element_mask;
      if (bit < 64) result_lo |= value << offset;
      else result_hi |= value << offset;
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = q ? result_hi : 0;
    return cpu.status;
  }

  /* NEON MUL Vd.8B/16B/4H/8H/2S/4S: wrapping per-lane integer products. */
  if ((instruction & UINT32_C(0xbf20fc00)) == UINT32_C(0x0e209c00)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t size = (instruction >> 22) & 3;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 3) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t element_bits = 8u << size;
    uint32_t lanes = (q ? 128u : 64u) / element_bits;
    uint64_t element_mask = width_mask(element_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t bit = lane * element_bits;
      uint64_t left_half = bit < 64 ? rn_lo : rn_hi;
      uint64_t right_half = bit < 64 ? rm_lo : rm_hi;
      uint32_t offset = bit & 63;
      uint64_t left = (left_half >> offset) & element_mask;
      uint64_t right = (right_half >> offset) & element_mask;
      uint64_t value = (left * right) & element_mask;
      if (bit < 64) result_lo |= value << offset;
      else result_hi |= value << offset;
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = q ? result_hi : 0;
    return cpu.status;
  }

  /* NEON MLA/MLS across byte, halfword, and word lanes with wrapping products. */
  if ((instruction & UINT32_C(0x9f20fc00)) == UINT32_C(0x0e209400)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t subtract = (instruction >> 29) & 1;
    uint32_t size = (instruction >> 22) & 3;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 3) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t element_bits = 8u << size;
    uint32_t lanes = (q ? 128u : 64u) / element_bits;
    uint64_t element_mask = width_mask(element_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t rd_lo = cpu.q_lo[rd], rd_hi = cpu.q_hi[rd];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t bit = lane * element_bits;
      uint64_t left_half = bit < 64 ? rn_lo : rn_hi;
      uint64_t right_half = bit < 64 ? rm_lo : rm_hi;
      uint64_t accumulator_half = bit < 64 ? rd_lo : rd_hi;
      uint32_t offset = bit & 63;
      uint64_t left = (left_half >> offset) & element_mask;
      uint64_t right = (right_half >> offset) & element_mask;
      uint64_t accumulator = (accumulator_half >> offset) & element_mask;
      uint64_t product = left * right;
      uint64_t value = (subtract ? accumulator - product : accumulator + product) & element_mask;
      if (bit < 64) result_lo |= value << offset;
      else result_hi |= value << offset;
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = q ? result_hi : 0;
    return cpu.status;
  }

  /* NEON SQDMULH/SQRDMULH: signed saturating doubling multiply-high. */
  if ((instruction & UINT32_C(0x9f20fc00)) == UINT32_C(0x0e20b400)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t round = (instruction >> 29) & 1;
    uint32_t size = (instruction >> 22) & 3;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 0 || size == 3) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t element_bits = 8u << size;
    uint32_t lanes = (q ? 128u : 64u) / element_bits;
    uint64_t element_mask = width_mask(element_bits);
    int64_t signed_minimum = -(INT64_C(1) << (element_bits - 1));
    uint64_t signed_maximum = (UINT64_C(1) << (element_bits - 1)) - 1;
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t bit = lane * element_bits;
      uint64_t left_half = bit < 64 ? rn_lo : rn_hi;
      uint64_t right_half = bit < 64 ? rm_lo : rm_hi;
      uint32_t offset = bit & 63;
      int64_t left = (int64_t)sign_extend((left_half >> offset) & element_mask, element_bits);
      int64_t right = (int64_t)sign_extend((right_half >> offset) & element_mask, element_bits);
      uint64_t value;
      if (left == signed_minimum && right == signed_minimum) value = signed_maximum;
      else {
        uint64_t product = (uint64_t)(left * right);
        if (round) product += UINT64_C(1) << (element_bits - 2);
        value = arithmetic_shift_right(product, element_bits - 1, 64) & element_mask;
      }
      if (bit < 64) result_lo |= value << offset;
      else result_hi |= value << offset;
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = q ? result_hi : 0;
    return cpu.status;
  }

  /* NEON TRN1/TRN2: interleave the even/odd lanes from two source vectors. */
  uint32_t neon_trn_class = instruction & UINT32_C(0xbf20fc00);
  if (neon_trn_class == UINT32_C(0x0e002800) ||
      neon_trn_class == UINT32_C(0x0e006800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t odd = neon_trn_class == UINT32_C(0x0e006800);
    uint32_t size = (instruction >> 22) & 3;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 3 && !q) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t element_bits = 8u << size;
    uint32_t lanes = (q ? 128u : 64u) / element_bits;
    uint64_t element_mask = width_mask(element_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t pair = 0; pair < lanes / 2; pair++) {
      uint32_t source_lane = pair * 2 + odd;
      uint32_t source_bit = source_lane * element_bits;
      uint64_t left_half = source_bit < 64 ? rn_lo : rn_hi;
      uint64_t right_half = source_bit < 64 ? rm_lo : rm_hi;
      uint32_t source_offset = source_bit & 63;
      uint64_t left = (left_half >> source_offset) & element_mask;
      uint64_t right = (right_half >> source_offset) & element_mask;
      uint32_t left_bit = pair * 2 * element_bits;
      uint32_t right_bit = left_bit + element_bits;
      if (left_bit < 64) result_lo |= left << (left_bit & 63);
      else result_hi |= left << (left_bit & 63);
      if (right_bit < 64) result_lo |= right << (right_bit & 63);
      else result_hi |= right << (right_bit & 63);
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = q ? result_hi : 0;
    return cpu.status;
  }

  /* NEON ZIP1/ZIP2: interleave the lower/upper halves of two lane vectors. */
  uint32_t neon_zip_class = instruction & UINT32_C(0xbf20fc00);
  if (neon_zip_class == UINT32_C(0x0e003800) ||
      neon_zip_class == UINT32_C(0x0e007800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t upper = neon_zip_class == UINT32_C(0x0e007800);
    uint32_t size = (instruction >> 22) & 3;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 3 && !q) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t element_bits = 8u << size;
    uint32_t lanes = (q ? 128u : 64u) / element_bits;
    uint32_t source_start = upper ? lanes / 2 : 0;
    uint64_t element_mask = width_mask(element_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t result_lo = 0, result_hi = 0;
    for (uint32_t pair = 0; pair < lanes / 2; pair++) {
      uint32_t source_lane = source_start + pair;
      uint32_t source_bit = source_lane * element_bits;
      uint64_t left_half = source_bit < 64 ? rn_lo : rn_hi;
      uint64_t right_half = source_bit < 64 ? rm_lo : rm_hi;
      uint32_t source_offset = source_bit & 63;
      uint64_t left = (left_half >> source_offset) & element_mask;
      uint64_t right = (right_half >> source_offset) & element_mask;
      uint32_t left_bit = pair * 2 * element_bits;
      uint32_t right_bit = left_bit + element_bits;
      if (left_bit < 64) result_lo |= left << (left_bit & 63);
      else result_hi |= left << (left_bit & 63);
      if (right_bit < 64) result_lo |= right << (right_bit & 63);
      else result_hi |= right << (right_bit & 63);
    }
    cpu.q_lo[rd] = result_lo;
    cpu.q_hi[rd] = q ? result_hi : 0;
    return cpu.status;
  }

  /* NEON INS Vd.<T>[dst], Vn.<T>[src] (MOV vector-element alias). */
  if ((instruction & UINT32_C(0xff200400)) == UINT32_C(0x6e000400)) {
    uint32_t imm5 = (instruction >> 16) & 31;
    uint32_t imm4 = (instruction >> 11) & 15;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t element_bits;
    uint32_t element_shift;
    if (imm5 & 1) { element_bits = 8; element_shift = 0; }
    else if (imm5 & 2) { element_bits = 16; element_shift = 1; }
    else if (imm5 & 4) { element_bits = 32; element_shift = 2; }
    else if (imm5 & 8) { element_bits = 64; element_shift = 3; }
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t destination_lane = imm5 >> (element_shift + 1);
    uint32_t source_lane = imm4 >> element_shift;
    uint32_t source_bit = source_lane * element_bits;
    uint32_t destination_bit = destination_lane * element_bits;
    uint64_t source_half = source_bit < 64 ? cpu.q_lo[rn] : cpu.q_hi[rn];
    uint64_t element_mask = width_mask(element_bits);
    uint64_t value = (source_half >> (source_bit & 63)) & element_mask;
    uint64_t *destination_half = destination_bit < 64 ? &cpu.q_lo[rd] : &cpu.q_hi[rd];
    uint32_t destination_offset = destination_bit & 63;
    *destination_half = (*destination_half & ~(element_mask << destination_offset)) |
      (value << destination_offset);
    return cpu.status;
  }

  /* NEON ADD Vd.2D, Vn.2D, Vm.2D: two wrapping 64-bit vector lanes. */
  if ((instruction & UINT32_C(0xffe0fc00)) == UINT32_C(0x4ee08400)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = cpu.q_lo[rn] + cpu.q_lo[rm];
    cpu.q_hi[rd] = cpu.q_hi[rn] + cpu.q_hi[rm];
    return cpu.status;
  }

  /* NEON wrapping integer ADD/SUB across byte, halfword, word, and 2D lanes. */
  uint32_t neon_integer_arithmetic_class = instruction & UINT32_C(0xbf20fc00);
  if (neon_integer_arithmetic_class == UINT32_C(0x0e208400) ||
      neon_integer_arithmetic_class == UINT32_C(0x2e208400)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t subtract = neon_integer_arithmetic_class == UINT32_C(0x2e208400);
    uint32_t size = (instruction >> 22) & 3;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (size == 3 && !q) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t element_bits = 8u << size;
    uint32_t lanes = (q ? 128u : 64u) / element_bits;
    uint64_t element_mask = width_mask(element_bits);
    uint64_t rn_lo = cpu.q_lo[rn], rn_hi = cpu.q_hi[rn];
    uint64_t rm_lo = cpu.q_lo[rm], rm_hi = cpu.q_hi[rm];
    uint64_t output[2] = { 0, 0 };
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint32_t bit = lane * element_bits;
      uint64_t left_half = bit < 64 ? rn_lo : rn_hi;
      uint64_t right_half = bit < 64 ? rm_lo : rm_hi;
      uint32_t offset = bit & 63;
      uint64_t left = (left_half >> offset) & element_mask;
      uint64_t right = (right_half >> offset) & element_mask;
      uint64_t result = (subtract ? left - right : left + right) & element_mask;
      output[bit >= 64] |= result << offset;
    }
    cpu.q_lo[rd] = output[0];
    cpu.q_hi[rd] = q ? output[1] : 0;
    return cpu.status;
  }

  /* NEON ADD Vd.2S/4S, Vn.2S/4S, Vm.2S/4S. */
  if ((instruction & UINT32_C(0xbfe0fc00)) == UINT32_C(0x0ea08400)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    for (uint32_t lane = 0; lane < (q ? 4u : 2u); lane++) {
      uint64_t left_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint64_t right_half = lane < 2 ? cpu.q_lo[rm] : cpu.q_hi[rm];
      uint32_t offset = (lane & 1) * 32;
      uint32_t result = (uint32_t)(left_half >> offset) + (uint32_t)(right_half >> offset);
      if (lane < 2) output_low |= (uint64_t)result << offset;
      else output_high |= (uint64_t)result << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON SUB Vd.2S/4S, Vn.2S/4S, Vm.2S/4S. */
  if ((instruction & UINT32_C(0xbfe0fc00)) == UINT32_C(0x2ea08400)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    for (uint32_t lane = 0; lane < (q ? 4u : 2u); lane++) {
      uint64_t left_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint64_t right_half = lane < 2 ? cpu.q_lo[rm] : cpu.q_hi[rm];
      uint32_t offset = (lane & 1) * 32;
      uint32_t result = (uint32_t)(left_half >> offset) - (uint32_t)(right_half >> offset);
      if (lane < 2) output_low |= (uint64_t)result << offset;
      else output_high |= (uint64_t)result << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON ADDV Sd, Vn.4S: wrapping horizontal sum into the scalar lane. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x4eb1b800)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t result = (uint32_t)cpu.q_lo[rn] + (uint32_t)(cpu.q_lo[rn] >> 32) +
      (uint32_t)cpu.q_hi[rn] + (uint32_t)(cpu.q_hi[rn] >> 32);
    cpu.q_lo[rd] = result;
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* Advanced SIMD scalar ADDP Dd, Vn.2D: wrapping pairwise 64-bit sum. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x5ef1b800)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = cpu.q_lo[rn] + cpu.q_hi[rn];
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* NEON NEG Vd.2S/4S, Vn.2S/4S: wrapping two's-complement negation per lane. */
  if ((instruction & UINT32_C(0xbffffc00)) == UINT32_C(0x2ea0b800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t source_low = cpu.q_lo[rn];
    uint64_t source_high = cpu.q_hi[rn];
    cpu.q_lo[rd] = (uint32_t)(0u - (uint32_t)source_low) |
      ((uint64_t)(uint32_t)(0u - (uint32_t)(source_low >> 32)) << 32);
    cpu.q_hi[rd] = q
      ? (uint32_t)(0u - (uint32_t)source_high) |
        ((uint64_t)(uint32_t)(0u - (uint32_t)(source_high >> 32)) << 32)
      : 0;
    return cpu.status;
  }

  /* NEON CMEQ Vd.2S/4S, Vn.2S/4S, #0. */
  if ((instruction & UINT32_C(0xbffffc00)) == UINT32_C(0x0ea09800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    uint32_t lanes = q ? 4 : 2;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint64_t source = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint32_t result = (uint32_t)(source >> ((lane & 1) * 32)) == 0 ? UINT32_MAX : 0;
      if (lane < 2) output_low |= (uint64_t)result << (lane * 32);
      else output_high |= (uint64_t)result << ((lane - 2) * 32);
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON FCMEQ Vd.2S/4S, Vn.2S/4S, #0.0. */
  if ((instruction & UINT32_C(0xbffffc00)) == UINT32_C(0x0ea0d800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output[2] = { 0, 0 };
    for (uint32_t lane = 0; lane < (q ? 4u : 2u); lane++) {
      uint64_t source_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint32_t offset = (lane & 1) * 32;
      union { float number; uint32_t bits; } source;
      source.bits = (uint32_t)(source_half >> offset);
      uint32_t result = source.number == 0.0f ? UINT32_MAX : 0;
      output[lane >= 2] |= (uint64_t)result << offset;
    }
    cpu.q_lo[rd] = output[0];
    cpu.q_hi[rd] = output[1];
    return cpu.status;
  }

  /* NEON CMEQ Vd.8B/16B, Vn.8B/16B, #0. */
  if ((instruction & UINT32_C(0xbffffc00)) == UINT32_C(0x0e209800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output[2] = { 0, 0 };
    uint32_t lanes = q ? 16 : 8;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint64_t source = lane < 8 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint8_t result = (uint8_t)(source >> ((lane & 7) * 8)) == 0 ? UINT8_MAX : 0;
      output[lane >= 8] |= (uint64_t)result << ((lane & 7) * 8);
    }
    cpu.q_lo[rd] = output[0];
    cpu.q_hi[rd] = output[1];
    return cpu.status;
  }

  /* NEON BSL Vd.8B/16B, Vn.8B/16B, Vm.8B/16B. */
  if ((instruction & UINT32_C(0xbfe0fc00)) == UINT32_C(0x2e601c00)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t mask_low = cpu.q_lo[rd];
    uint64_t mask_high = cpu.q_hi[rd];
    cpu.q_lo[rd] = (mask_low & cpu.q_lo[rn]) | (~mask_low & cpu.q_lo[rm]);
    cpu.q_hi[rd] = q ? (mask_high & cpu.q_hi[rn]) | (~mask_high & cpu.q_hi[rm]) : 0;
    return cpu.status;
  }

  /* NEON CMTST Vd.2S/4S, Vn.2S/4S, Vm.2S/4S. */
  if ((instruction & UINT32_C(0xbfe0fc00)) == UINT32_C(0x0ea08c00)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    uint32_t lanes = q ? 4 : 2;
    for (uint32_t lane = 0; lane < lanes; lane++) {
      uint64_t left = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint64_t right = lane < 2 ? cpu.q_lo[rm] : cpu.q_hi[rm];
      uint32_t offset = (lane & 1) * 32;
      uint32_t result = ((uint32_t)(left >> offset) & (uint32_t)(right >> offset)) ? UINT32_MAX : 0;
      if (lane < 2) output_low |= (uint64_t)result << offset;
      else output_high |= (uint64_t)result << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON MVN Vd.8B/16B, Vn.8B/16B (NOT alias). */
  if ((instruction & UINT32_C(0xbffffc00)) == UINT32_C(0x2e205800)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = ~cpu.q_lo[rn];
    cpu.q_hi[rd] = q ? ~cpu.q_hi[rn] : 0;
    return cpu.status;
  }

  /* NEON UMOV Wd/Xd, Vn.<T>[index]: copy one vector lane to a GPR. */
  if ((instruction & UINT32_C(0xbf20fc00)) == UINT32_C(0x0e003c00)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t imm5 = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t element_bits;
    uint32_t element_shift;
    if (imm5 & 1) { element_bits = 8; element_shift = 0; }
    else if (imm5 & 2) { element_bits = 16; element_shift = 1; }
    else if (imm5 & 4) { element_bits = 32; element_shift = 2; }
    else if ((imm5 & 8) && q) { element_bits = 64; element_shift = 3; }
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    if (q != (element_bits == 64)) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t lane = imm5 >> (element_shift + 1);
    uint32_t bit_offset = lane * element_bits;
    uint64_t half = bit_offset < 64 ? cpu.q_lo[rn] : cpu.q_hi[rn];
    uint64_t value = (half >> (bit_offset & 63)) & width_mask(element_bits);
    write_register(rd, value, q, 0);
    return cpu.status;
  }

  /* NEON INS Vd.<T>[index], Wn/Xn (MOV vector-element alias). */
  if ((instruction & UINT32_C(0xffe0fc00)) == UINT32_C(0x4e001c00)) {
    uint32_t imm5 = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t element_bits;
    uint32_t element_shift;
    if (imm5 & 1) { element_bits = 8; element_shift = 0; }
    else if (imm5 & 2) { element_bits = 16; element_shift = 1; }
    else if (imm5 & 4) { element_bits = 32; element_shift = 2; }
    else if (imm5 & 8) { element_bits = 64; element_shift = 3; }
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t lane = imm5 >> (element_shift + 1);
    uint32_t bit_offset = lane * element_bits;
    uint64_t element_mask = width_mask(element_bits);
    uint64_t value = read_register(rn, 0) & element_mask;
    uint64_t *half = bit_offset < 64 ? &cpu.q_lo[rd] : &cpu.q_hi[rd];
    uint32_t half_offset = bit_offset & 63;
    *half = (*half & ~(element_mask << half_offset)) | (value << half_offset);
    return cpu.status;
  }

  /* NEON XTN Vd.2S, Vn.2D: narrow the low 32 bits from both 64-bit lanes. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x0ea12800)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = (uint32_t)cpu.q_lo[rn] | (cpu.q_hi[rn] << 32);
    cpu.q_hi[rd] = 0;
    return cpu.status;
  }

  /* NEON XTN2 Vd.4S, Vn.2D: narrow into the upper half of the destination. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x4ea12800)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_hi[rd] = (uint32_t)cpu.q_lo[rn] | (cpu.q_hi[rn] << 32);
    return cpu.status;
  }

  /* NEON USHLL Vd.8H, Vn.8B, #0: widen eight unsigned byte lanes. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x2f08a400)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t source = cpu.q_lo[rn];
    uint64_t low = 0;
    uint64_t high = 0;
    for (uint32_t lane = 0; lane < 4; lane++) low |= ((source >> (lane * 8)) & 0xff) << (lane * 16);
    for (uint32_t lane = 4; lane < 8; lane++) high |= ((source >> (lane * 8)) & 0xff) << ((lane - 4) * 16);
    cpu.q_lo[rd] = low;
    cpu.q_hi[rd] = high;
    return cpu.status;
  }

  /* NEON USHLL2 Vd.8H, Vn.16B, #0: widen the upper eight byte lanes. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x6f08a400)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t source = cpu.q_hi[rn];
    uint64_t low = 0;
    uint64_t high = 0;
    for (uint32_t lane = 0; lane < 4; lane++) low |= ((source >> (lane * 8)) & 0xff) << (lane * 16);
    for (uint32_t lane = 4; lane < 8; lane++) high |= ((source >> (lane * 8)) & 0xff) << ((lane - 4) * 16);
    cpu.q_lo[rd] = low;
    cpu.q_hi[rd] = high;
    return cpu.status;
  }

  /* NEON USHLL/USHLL2 zero-shift widening from halfwords to words. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x2f10a400) ||
      (instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x6f10a400)) {
    uint32_t upper = instruction >> 30;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t source = upper ? cpu.q_hi[rn] : cpu.q_lo[rn];
    cpu.q_lo[rd] = (uint16_t)source | (((source >> 16) & 0xffff) << 32);
    cpu.q_hi[rd] = ((source >> 32) & 0xffff) | (((source >> 48) & 0xffff) << 32);
    return cpu.status;
  }

  /* NEON SSHLL/SSHLL2 zero-shift signed widening from halfwords to words. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x0f10a400) ||
      (instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x4f10a400)) {
    uint32_t upper = instruction >> 30;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t source = upper ? cpu.q_hi[rn] : cpu.q_lo[rn];
    cpu.q_lo[rd] = (uint32_t)(int32_t)(int16_t)source |
      ((uint64_t)(uint32_t)(int32_t)(int16_t)(source >> 16) << 32);
    cpu.q_hi[rd] = (uint32_t)(int32_t)(int16_t)(source >> 32) |
      ((uint64_t)(uint32_t)(int32_t)(int16_t)(source >> 48) << 32);
    return cpu.status;
  }

  /* NEON USHLL/USHLL2 zero-shift widening from words to doublewords. */
  if ((instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x2f20a400) ||
      (instruction & UINT32_C(0xfffffc00)) == UINT32_C(0x6f20a400)) {
    uint32_t upper = instruction >> 30;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t source = upper ? cpu.q_hi[rn] : cpu.q_lo[rn];
    cpu.q_lo[rd] = (uint32_t)source;
    cpu.q_hi[rd] = source >> 32;
    return cpu.status;
  }

  /* NEON AND Vd.8B/16B, Vn.8B/16B, Vm.8B/16B. */
  if ((instruction & UINT32_C(0xbfe0fc00)) == UINT32_C(0x0e201c00)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = cpu.q_lo[rn] & cpu.q_lo[rm];
    cpu.q_hi[rd] = q ? cpu.q_hi[rn] & cpu.q_hi[rm] : 0;
    return cpu.status;
  }

  /* NEON ORR Vd.8B/16B, Vn.8B/16B, Vm.8B/16B. */
  if ((instruction & UINT32_C(0xbfe0fc00)) == UINT32_C(0x0ea01c00)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = cpu.q_lo[rn] | cpu.q_lo[rm];
    cpu.q_hi[rd] = q ? cpu.q_hi[rn] | cpu.q_hi[rm] : 0;
    return cpu.status;
  }

  /* NEON EOR Vd.8B/16B, Vn.8B/16B, Vm.8B/16B. */
  if ((instruction & UINT32_C(0xbfe0fc00)) == UINT32_C(0x2e201c00)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    cpu.q_lo[rd] = cpu.q_lo[rn] ^ cpu.q_lo[rm];
    cpu.q_hi[rd] = q ? cpu.q_hi[rn] ^ cpu.q_hi[rm] : 0;
    return cpu.status;
  }

  /* NEON SSHL Vd.4S, Vn.4S, Vm.4S with signed per-lane shift counts. */
  if ((instruction & UINT32_C(0xffe0fc00)) == UINT32_C(0x4ea04400)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    for (uint32_t lane = 0; lane < 4; lane++) {
      uint64_t source_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint64_t shift_half = lane < 2 ? cpu.q_lo[rm] : cpu.q_hi[rm];
      uint32_t offset = (lane & 1) * 32;
      uint32_t value = (uint32_t)(source_half >> offset);
      int32_t shift = (int8_t)(shift_half >> offset);
      uint32_t result;
      if (shift >= 32) result = 0;
      else if (shift <= -32) result = (value & UINT32_C(0x80000000)) ? UINT32_MAX : 0;
      else if (shift >= 0) result = value << shift;
      else result = (uint32_t)arithmetic_shift_right(value, (uint32_t)-shift, 32);
      if (lane < 2) output_low |= (uint64_t)result << offset;
      else output_high |= (uint64_t)result << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON USHL Vd.2S/4S, Vn.2S/4S, Vm.2S/4S with signed per-lane shift counts. */
  if ((instruction & UINT32_C(0xbfe0fc00)) == UINT32_C(0x2ea04400)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    for (uint32_t lane = 0; lane < (q ? 4u : 2u); lane++) {
      uint64_t source_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint64_t shift_half = lane < 2 ? cpu.q_lo[rm] : cpu.q_hi[rm];
      uint32_t offset = (lane & 1) * 32;
      uint32_t value = (uint32_t)(source_half >> offset);
      int32_t shift = (int8_t)(shift_half >> offset);
      uint32_t result;
      if (shift >= 32 || shift <= -32) result = 0;
      else if (shift >= 0) result = value << shift;
      else result = value >> -shift;
      if (lane < 2) output_low |= (uint64_t)result << offset;
      else output_high |= (uint64_t)result << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = q ? output_high : 0;
    return cpu.status;
  }

  /* NEON MUL Vd.4S, Vn.4S, Vm.4S with wrapping 32-bit products. */
  if ((instruction & UINT32_C(0xffe0fc00)) == UINT32_C(0x4ea09c00)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    for (uint32_t lane = 0; lane < 4; lane++) {
      uint64_t left_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint64_t right_half = lane < 2 ? cpu.q_lo[rm] : cpu.q_hi[rm];
      uint32_t offset = (lane & 1) * 32;
      uint32_t result = (uint32_t)(left_half >> offset) * (uint32_t)(right_half >> offset);
      if (lane < 2) output_low |= (uint64_t)result << offset;
      else output_high |= (uint64_t)result << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON MLA Vd.4S, Vn.4S, Vm.4S with wrapping multiply-accumulate. */
  if ((instruction & UINT32_C(0xffe0fc00)) == UINT32_C(0x4ea09400)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t output_low = 0;
    uint64_t output_high = 0;
    for (uint32_t lane = 0; lane < 4; lane++) {
      uint64_t left_half = lane < 2 ? cpu.q_lo[rn] : cpu.q_hi[rn];
      uint64_t right_half = lane < 2 ? cpu.q_lo[rm] : cpu.q_hi[rm];
      uint64_t accumulator_half = lane < 2 ? cpu.q_lo[rd] : cpu.q_hi[rd];
      uint32_t offset = (lane & 1) * 32;
      uint32_t result = (uint32_t)(accumulator_half >> offset) +
        (uint32_t)(left_half >> offset) * (uint32_t)(right_half >> offset);
      if (lane < 2) output_low |= (uint64_t)result << offset;
      else output_high |= (uint64_t)result << offset;
    }
    cpu.q_lo[rd] = output_low;
    cpu.q_hi[rd] = output_high;
    return cpu.status;
  }

  /* NEON LD2-4/ST2-4 one-element structure transfers. */
  if ((instruction & UINT32_C(0xbf000000)) == UINT32_C(0x0d000000)) {
    uint32_t opcode = (instruction >> 13) & 7;
    uint32_t pair = (instruction >> 21) & 1;
    uint32_t count = (opcode & 1) ? (pair ? 4 : 3) : (pair ? 2 : 0);
    if (count) {
      uint32_t q = (instruction >> 30) & 1;
      uint32_t post_index = (instruction >> 23) & 1;
      uint32_t load = (instruction >> 22) & 1;
      uint32_t rm = (instruction >> 16) & 31;
      uint32_t s = (instruction >> 12) & 1;
      uint32_t size = (instruction >> 10) & 3;
      uint32_t rn = (instruction >> 5) & 31;
      uint32_t rt = instruction & 31;
      uint32_t element_shift = opcode >> 1;
      uint32_t element_bits = 8u << element_shift;
      uint32_t lane;
      if (element_shift == 0) lane = q * 8 + s * 4 + size;
      else if (element_shift == 1 && (size & 1) == 0) lane = q * 4 + s * 2 + (size >> 1);
      else if (element_shift == 2 && size == 0) lane = q * 2 + s;
      else if (element_shift == 3 && !s && size == 1) lane = q;
      else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
      if ((!post_index && rm != 0) || lane >= 128 / element_bits) {
        return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
      }
      uint32_t element_bytes = element_bits / 8;
      uint64_t address = read_register(rn, 1);
      if (!address_is_valid(address, count * element_bytes)) return fail(ARM64_FAULT_MEMORY, address);
      uint32_t bit = lane * element_bits;
      uint32_t offset = bit & 63;
      uint64_t element_mask = width_mask(element_bits);
      for (uint32_t index = 0; index < count; index++) {
        uint32_t reg = (rt + index) & 31;
        uint64_t *vector_half = bit < 64 ? &cpu.q_lo[reg] : &cpu.q_hi[reg];
        uint64_t element_address = address + index * element_bytes;
        if (load) {
          uint64_t value = load_integer(element_address, element_bytes) & element_mask;
          *vector_half = (*vector_half & ~(element_mask << offset)) | (value << offset);
        } else store_integer(element_address, (*vector_half >> offset) & element_mask, element_bytes);
      }
      if (post_index) {
        uint64_t increment = rm == 31 ? count * element_bytes : read_register(rm, 0);
        write_register(rn, address + increment, 1, 1);
      }
      return cpu.status;
    }
  }

  /*
   * NEON LD1/ST1 single element to/from one vector register, optionally with
   * immediate or register post-index writeback.
   */
  if ((instruction & UINT32_C(0xbf200000)) == UINT32_C(0x0d000000)) {
    uint32_t q = (instruction >> 30) & 1;
    uint32_t post_index = (instruction >> 23) & 1;
    uint32_t load = (instruction >> 22) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t opcode = (instruction >> 13) & 7;
    uint32_t s = (instruction >> 12) & 1;
    uint32_t size = (instruction >> 10) & 3;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    uint32_t element_bits;
    uint32_t lane;
    if (opcode == 0) {
      element_bits = 8;
      lane = q * 8 + s * 4 + size;
    } else if (opcode == 2 && (size & 1) == 0) {
      element_bits = 16;
      lane = q * 4 + s * 2 + (size >> 1);
    } else if (opcode == 4 && size == 0) {
      element_bits = 32;
      lane = q * 2 + s;
    } else if (opcode == 4 && !s && size == 1) {
      element_bits = 64;
      lane = q;
    } else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    if ((!post_index && rm != 0) || lane >= 128 / element_bits) {
      return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    }
    uint32_t element_bytes = element_bits / 8;
    uint64_t address = read_register(rn, 1);
    if (!address_is_valid(address, element_bytes)) return fail(ARM64_FAULT_MEMORY, address);
    uint32_t bit = lane * element_bits;
    uint64_t *vector_half = bit < 64 ? &cpu.q_lo[rt] : &cpu.q_hi[rt];
    uint32_t offset = bit & 63;
    uint64_t element_mask = width_mask(element_bits);
    if (load) {
      uint64_t value = load_integer(address, element_bytes) & element_mask;
      *vector_half = (*vector_half & ~(element_mask << offset)) | (value << offset);
    } else store_integer(address, (*vector_half >> offset) & element_mask, element_bytes);
    if (post_index) {
      uint64_t increment = rm == 31 ? element_bytes : read_register(rm, 0);
      write_register(rn, address + increment, 1, 1);
    }
    return cpu.status;
  }

  /*
   * NEON LD1/ST1 consecutive and LD2-4/ST2-4 interleaved 16-byte register
   * lists, with no writeback, immediate post-index, or register post-index.
   */
  if ((instruction & UINT32_C(0xbf000000)) == UINT32_C(0x0c000000) &&
      ((instruction >> 30) & 1) && ((instruction >> 10) & 3) == 0) {
    uint32_t post_index = (instruction >> 23) & 1;
    uint32_t load = (instruction >> 22) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t opcode = (instruction >> 12) & 15;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    uint32_t interleaved_count = opcode == 8 ? 2 : opcode == 4 ? 3 : opcode == 0 ? 4 : 0;
    uint32_t interleaved = interleaved_count != 0;
    uint32_t count = interleaved ? interleaved_count : opcode == 7 ? 1 : opcode == 10 ? 2 : opcode == 6 ? 3 : opcode == 2 ? 4 : 0;
    if (!count || (!post_index && rm != 0)) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t address = read_register(rn, 1);
    if (!address_is_valid(address, count * 16)) return fail(ARM64_FAULT_MEMORY, address);
    if (interleaved) {
      if (load) {
        cpu.q_lo[rt] = cpu.q_hi[rt] = 0;
        for (uint32_t index = 1; index < count; index++) {
          cpu.q_lo[(rt + index) & 31] = cpu.q_hi[(rt + index) & 31] = 0;
        }
      }
      for (uint32_t lane = 0; lane < 16; lane++) {
        for (uint32_t index = 0; index < count; index++) {
          uint32_t reg = (rt + index) & 31;
          uint64_t byte_address = address + lane * count + index;
          uint32_t shift = (lane & 7) * 8;
          if (load) {
            uint64_t value = load_integer(byte_address, 1) << shift;
            if (lane < 8) cpu.q_lo[reg] |= value; else cpu.q_hi[reg] |= value;
          } else {
            uint64_t source = lane < 8 ? cpu.q_lo[reg] : cpu.q_hi[reg];
            store_integer(byte_address, source >> shift, 1);
          }
        }
      }
    } else {
      for (uint32_t index = 0; index < count; index++) {
        uint32_t reg = (rt + index) & 31;
        uint64_t lane_address = address + index * 16;
        if (load) {
          cpu.q_lo[reg] = load_integer(lane_address, 8);
          cpu.q_hi[reg] = load_integer(lane_address + 8, 8);
        } else {
          store_integer(lane_address, cpu.q_lo[reg], 8);
          store_integer(lane_address + 8, cpu.q_hi[reg], 8);
        }
      }
    }
    if (post_index) {
      uint64_t increment = rm == 31 ? count * 16 : read_register(rm, 0);
      write_register(rn, address + increment, 1, 1);
    }
    return cpu.status;
  }

  /* Supervisor call: stop at the browser syscall boundary after advancing PC. */
  if ((instruction & UINT32_C(0xffe0001f)) == UINT32_C(0xd4000001)) {
    cpu.status = ARM64_STATUS_SYSCALL;
    cpu.fault_address = instruction_pc;
    return cpu.status;
  }

  /* BRK is reserved for browser host-function bridges. */
  if ((instruction & UINT32_C(0xffe0001f)) == UINT32_C(0xd4200000)) {
    cpu.status = ARM64_STATUS_HOSTCALL;
    cpu.fault_address = instruction_pc;
    return cpu.status;
  }

  /* MOVN, MOVZ and MOVK (wide immediate), 32- and 64-bit forms. */
  uint32_t wide_class = instruction & UINT32_C(0x7f800000);
  if (wide_class == UINT32_C(0x12800000) || wide_class == UINT32_C(0x52800000) || wide_class == UINT32_C(0x72800000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t halfword = (instruction >> 21) & 3;
    uint32_t shift = halfword * 16;
    uint32_t rd = instruction & 31;
    if (!is_64 && halfword > 1) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t immediate = (uint64_t)((instruction >> 5) & 0xffff) << shift;
    uint64_t value;
    if (wide_class == UINT32_C(0x12800000)) value = ~immediate;
    else if (wide_class == UINT32_C(0x52800000)) value = immediate;
    else {
      uint64_t mask = UINT64_C(0xffff) << shift;
      value = (read_register(rd, 0) & ~mask) | immediate;
    }
    write_register(rd, value, is_64, 0);
    return cpu.status;
  }

  /* ADR and ADRP. */
  uint32_t adr_class = instruction & UINT32_C(0x9f000000);
  if (adr_class == UINT32_C(0x10000000) || adr_class == UINT32_C(0x90000000)) {
    uint64_t immediate = ((uint64_t)((instruction >> 5) & 0x7ffff) << 2) | ((instruction >> 29) & 3);
    uint32_t rd = instruction & 31;
    if (adr_class == UINT32_C(0x90000000)) {
      immediate = sign_extend(immediate, 21) << 12;
      write_register(rd, (instruction_pc & ~UINT64_C(0xfff)) + immediate, 1, 0);
    } else {
      immediate = sign_extend(immediate, 21);
      write_register(rd, instruction_pc + immediate, 1, 0);
    }
    return cpu.status;
  }

  /* Unconditional immediate branch and branch-with-link. */
  uint32_t branch_class = instruction & UINT32_C(0xfc000000);
  if (branch_class == UINT32_C(0x14000000) || branch_class == UINT32_C(0x94000000)) {
    uint64_t offset = sign_extend(instruction & UINT32_C(0x03ffffff), 26) << 2;
    uint64_t target = instruction_pc + offset;
    if (branch_class == UINT32_C(0x94000000)) {
      record_call(instruction_pc, target);
      cpu.x[30] = cpu.pc;
    }
    cpu.pc = target;
    return cpu.status;
  }

  /* Conditional branch. */
  if ((instruction & UINT32_C(0xff000010)) == UINT32_C(0x54000000)) {
    uint64_t offset = sign_extend((instruction >> 5) & 0x7ffff, 19) << 2;
    if (condition_holds(instruction & 15)) cpu.pc = instruction_pc + offset;
    return cpu.status;
  }

  /* Compare-and-branch on zero/nonzero: CBZ and CBNZ. */
  if ((instruction & UINT32_C(0x7e000000)) == UINT32_C(0x34000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t nonzero = (instruction >> 24) & 1;
    uint32_t rt = instruction & 31;
    uint64_t value = read_register(rt, 0) & width_mask(is_64 ? 64 : 32);
    uint64_t offset = sign_extend((instruction >> 5) & 0x7ffff, 19) << 2;
    if ((value != 0) == nonzero) cpu.pc = instruction_pc + offset;
    return cpu.status;
  }

  /* Test-bit-and-branch on zero/nonzero: TBZ and TBNZ. */
  if ((instruction & UINT32_C(0x7e000000)) == UINT32_C(0x36000000)) {
    uint32_t nonzero = (instruction >> 24) & 1;
    uint32_t bit = ((instruction >> 26) & 0x20) | ((instruction >> 19) & 0x1f);
    uint32_t rt = instruction & 31;
    uint64_t offset = sign_extend((instruction >> 5) & 0x3fff, 14) << 2;
    if ((((read_register(rt, 0) >> bit) & 1) != 0) == nonzero) cpu.pc = instruction_pc + offset;
    return cpu.status;
  }

  /* Conditional compare immediate/register: CCMN and CCMP. */
  uint32_t conditional_compare_class = instruction & UINT32_C(0x3fe00c10);
  if (conditional_compare_class == UINT32_C(0x3a400800) ||
      conditional_compare_class == UINT32_C(0x3a400000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t subtract = (instruction >> 30) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t condition = (instruction >> 12) & 15;
    if (condition_holds(condition)) {
      uint64_t right = conditional_compare_class == UINT32_C(0x3a400800)
        ? (instruction >> 16) & 31
        : read_register((instruction >> 16) & 31, 0);
      uint64_t left = read_register(rn, 0);
      uint64_t result = subtract ? left - right : left + right;
      set_add_sub_flags(left, right, result, is_64 ? 64 : 32, subtract);
    } else {
      cpu.nzcv = (instruction & 15) << 28;
    }
    return cpu.status;
  }

  /* Conditional select family: CSEL, CSINC, CSINV and CSNEG. */
  if ((instruction & UINT32_C(0x1fe00000)) == UINT32_C(0x1a800000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t operation = (((instruction >> 30) & 1) << 1) | ((instruction >> 10) & 1);
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t condition = (instruction >> 12) & 15;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t value;
    if (condition_holds(condition)) value = read_register(rn, 0);
    else {
      uint64_t alternate = read_register(rm, 0);
      value = operation == 0 ? alternate : operation == 1 ? alternate + 1 : operation == 2 ? ~alternate : -alternate;
    }
    write_register(rd, value, is_64, 0);
    return cpu.status;
  }

  /* Multiply-add/subtract. Covers the MUL and MNEG aliases when Ra is XZR/WZR. */
  if ((instruction & UINT32_C(0x7fe00000)) == UINT32_C(0x1b000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t subtract = (instruction >> 15) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t ra = (instruction >> 10) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t left = read_register(rn, 0);
    uint64_t right = read_register(rm, 0);
    uint64_t accumulator = read_register(ra, 0);
    if (!is_64) {
      left = (uint32_t)left;
      right = (uint32_t)right;
      accumulator = (uint32_t)accumulator;
    }
    uint64_t product = left * right;
    uint64_t value = subtract ? accumulator - product : accumulator + product;
    write_register(rd, value, is_64, 0);
    return cpu.status;
  }

  /* Signed/unsigned widening multiply-add/subtract: SMADDL, SMSUBL, UMADDL and UMSUBL. */
  if ((instruction & UINT32_C(0xff200000)) == UINT32_C(0x9b200000)) {
    uint32_t is_unsigned = (instruction >> 23) & 1;
    uint32_t subtract = (instruction >> 15) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t ra = (instruction >> 10) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t product;
    if (is_unsigned) product = (uint64_t)(uint32_t)read_register(rn, 0) * (uint64_t)(uint32_t)read_register(rm, 0);
    else product = (uint64_t)((int64_t)(int32_t)read_register(rn, 0) * (int64_t)(int32_t)read_register(rm, 0));
    uint64_t accumulator = read_register(ra, 0);
    write_register(rd, subtract ? accumulator - product : accumulator + product, 1, 0);
    return cpu.status;
  }

  /* High 64 bits of signed/unsigned 64-by-64 multiplication: SMULH and UMULH. */
  uint32_t multiply_high_class = instruction & UINT32_C(0xffe0fc00);
  if (multiply_high_class == UINT32_C(0x9b407c00) || multiply_high_class == UINT32_C(0x9bc07c00)) {
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t left = read_register(rn, 0);
    uint64_t right = read_register(rm, 0);
    uint64_t result = multiply_high_unsigned(left, right);
    if (multiply_high_class == UINT32_C(0x9b407c00)) {
      if ((int64_t)left < 0) result -= right;
      if ((int64_t)right < 0) result -= left;
    }
    write_register(rd, result, 1, 0);
    return cpu.status;
  }

  /* Data-processing (one source): RBIT, REV16, REV32/REV, REV64, CLZ and CLS. */
  if ((instruction & UINT32_C(0x7fff0000)) == UINT32_C(0x5ac00000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t bits = is_64 ? 64 : 32;
    uint32_t operation = (instruction >> 10) & 0x3f;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t source = read_register(rn, 0) & width_mask(bits);
    uint64_t value;
    if (operation == 0) value = reverse_bits(source, bits);
    else if (operation == 1) value = reverse_bytes_in_lanes(source, bits, 16);
    else if (operation == 2) value = reverse_bytes_in_lanes(source, bits, 32);
    else if (operation == 3 && is_64) value = reverse_bytes_in_lanes(source, bits, 64);
    else if (operation == 4) value = count_leading_zeros(source, bits);
    else if (operation == 5) value = count_leading_zeros(source ^ (source & (UINT64_C(1) << (bits - 1)) ? width_mask(bits) : 0), bits) - 1;
    else return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    write_register(rd, value, is_64, 0);
    return cpu.status;
  }

  /* Variable shifts: LSLV, LSRV, ASRV and RORV. */
  if ((instruction & UINT32_C(0x7fe0f000)) == UINT32_C(0x1ac02000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t bits = is_64 ? 64 : 32;
    uint32_t operation = (instruction >> 10) & 3;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t amount = (uint32_t)read_register(rm, 0) & (bits - 1);
    uint64_t value = read_register(rn, 0) & width_mask(bits);
    if (operation == 0) value <<= amount;
    else if (operation == 1) value >>= amount;
    else if (operation == 2) value = arithmetic_shift_right(value, amount, bits);
    else value = rotate_right(value, amount, bits);
    write_register(rd, value, is_64, 0);
    return cpu.status;
  }

  /* Extract register. Covers the ROR-immediate alias when Rn and Rm match. */
  if ((instruction & UINT32_C(0x7fa00000)) == UINT32_C(0x13800000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t bits = is_64 ? 64 : 32;
    uint32_t n = (instruction >> 22) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t amount = (instruction >> 10) & 0x3f;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (n != is_64 || amount >= bits) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t high = read_register(rn, 0) & width_mask(bits);
    uint64_t low = read_register(rm, 0) & width_mask(bits);
    uint64_t value = amount == 0 ? low : (low >> amount) | (high << (bits - amount));
    write_register(rd, value, is_64, 0);
    return cpu.status;
  }

  /* Signed and unsigned division. Division by zero produces zero on AArch64. */
  uint32_t divide_class = instruction & UINT32_C(0x7fe0fc00);
  if (divide_class == UINT32_C(0x1ac00800) || divide_class == UINT32_C(0x1ac00c00)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t is_signed = divide_class == UINT32_C(0x1ac00c00);
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t result = 0;
    if (is_64) {
      uint64_t dividend = read_register(rn, 0);
      uint64_t divisor = read_register(rm, 0);
      if (divisor) {
        if (!is_signed) result = dividend / divisor;
        else if (dividend == UINT64_C(0x8000000000000000) && divisor == UINT64_MAX) result = dividend;
        else result = (uint64_t)((int64_t)dividend / (int64_t)divisor);
      }
    } else {
      uint32_t dividend = (uint32_t)read_register(rn, 0);
      uint32_t divisor = (uint32_t)read_register(rm, 0);
      if (divisor) {
        if (!is_signed) result = dividend / divisor;
        else if (dividend == UINT32_C(0x80000000) && divisor == UINT32_MAX) result = dividend;
        else result = (uint32_t)((int32_t)dividend / (int32_t)divisor);
      }
    }
    write_register(rd, result, is_64, 0);
    return cpu.status;
  }

  /* BR, BLR and RET. */
  uint32_t register_branch = instruction & UINT32_C(0xfffffc1f);
  if (register_branch == UINT32_C(0xd61f0000) || register_branch == UINT32_C(0xd63f0000) || register_branch == UINT32_C(0xd65f0000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint64_t target = read_register(rn, 0);
    if (register_branch == UINT32_C(0xd63f0000)) {
      record_call(instruction_pc, target);
      cpu.x[30] = cpu.pc;
    }
    if (register_branch == UINT32_C(0xd65f0000) && target == UINT64_MAX) {
      cpu.status = ARM64_STATUS_HALTED;
      return cpu.status;
    }
    cpu.pc = target;
    return cpu.status;
  }

  /* ADD/SUB immediate without flags. Register 31 denotes SP here. */
  if ((instruction & UINT32_C(0x1f000000)) == UINT32_C(0x11000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t subtract = (instruction >> 30) & 1;
    uint32_t set_flags = (instruction >> 29) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t immediate = (instruction >> 10) & 0xfff;
    if ((instruction >> 22) & 1) immediate <<= 12;
    uint64_t left = read_register(rn, 1);
    uint64_t result = subtract ? left - immediate : left + immediate;
    if (set_flags) set_add_sub_flags(left, immediate, result, is_64 ? 64 : 32, subtract);
    write_register(rd, result, is_64, set_flags ? 0 : 1);
    return cpu.status;
  }

  /* ADD/SUB shifted register with LSL, LSR or ASR. */
  if ((instruction & UINT32_C(0x1f200000)) == UINT32_C(0x0b000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t subtract = (instruction >> 30) & 1;
    uint32_t set_flags = (instruction >> 29) & 1;
    uint32_t shift_type = (instruction >> 22) & 3;
    uint32_t amount = (instruction >> 10) & 0x3f;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t bits = is_64 ? 64 : 32;
    if (shift_type == 3 || amount >= bits) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t right = read_register(rm, 0) & width_mask(bits);
    if (shift_type == 0) right <<= amount;
    else if (shift_type == 1) right >>= amount;
    else right = arithmetic_shift_right(right, amount, bits);
    uint64_t left = read_register(rn, 0);
    uint64_t result = subtract ? left - right : left + right;
    if (set_flags) set_add_sub_flags(left, right, result, is_64 ? 64 : 32, subtract);
    write_register(rd, result, is_64, 0);
    return cpu.status;
  }

  /* ADD/SUB extended register without flags. */
  if ((instruction & UINT32_C(0x1fe00000)) == UINT32_C(0x0b200000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t subtract = (instruction >> 30) & 1;
    uint32_t set_flags = (instruction >> 29) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t option = (instruction >> 13) & 7;
    uint32_t amount = (instruction >> 10) & 7;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t right = read_register(rm, 0);
    uint32_t source_bits = option == 0 || option == 4 ? 8 : option == 1 || option == 5 ? 16 : option == 2 || option == 6 ? 32 : 64;
    if (source_bits < 64) right &= (UINT64_C(1) << source_bits) - 1;
    if (option >= 4 && source_bits < 64) right = sign_extend(right, source_bits);
    right <<= amount;
    uint64_t left = read_register(rn, 1);
    uint64_t result = subtract ? left - right : left + right;
    if (set_flags) set_add_sub_flags(left, right, result, is_64 ? 64 : 32, subtract);
    write_register(rd, result, is_64, set_flags ? 0 : 1);
    return cpu.status;
  }

  /* AND/ORR/EOR/ANDS logical immediate. */
  if ((instruction & UINT32_C(0x1f800000)) == UINT32_C(0x12000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t operation = (instruction >> 29) & 3;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint64_t immediate;
    if (!decode_logical_immediate(instruction, is_64 ? 64 : 32, &immediate)) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t left = read_register(rn, 0);
    uint64_t value = operation == 0 || operation == 3 ? left & immediate : operation == 1 ? left | immediate : left ^ immediate;
    write_register(rd, value, is_64, 0);
    if (operation == 3) {
      uint64_t masked = value & width_mask(is_64 ? 64 : 32);
      cpu.nzcv = ((masked >> ((is_64 ? 64 : 32) - 1)) << 31) | ((masked == 0) << 30);
    }
    return cpu.status;
  }

  /* Signed bitfield move. Covers ASR and SXTB/SXTH/SXTW aliases. */
  if ((instruction & UINT32_C(0x7f800000)) == UINT32_C(0x13000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t bits = is_64 ? 64 : 32;
    uint32_t n = (instruction >> 22) & 1;
    uint32_t immr = (instruction >> 16) & 0x3f;
    uint32_t imms = (instruction >> 10) & 0x3f;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (n != is_64 || immr >= bits || imms >= bits) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t value;
    if (imms >= immr) {
      uint32_t field_bits = imms - immr + 1;
      value = sign_extend((read_register(rn, 0) >> immr) & width_mask(field_bits), field_bits);
    } else {
      uint32_t field_bits = imms + 1;
      value = sign_extend(read_register(rn, 0) & width_mask(field_bits), field_bits) << (bits - immr);
    }
    write_register(rd, value, is_64, 0);
    return cpu.status;
  }

  /* Unsigned bitfield move. Covers LSL/LSR and UXTB/UXTH/UXTW aliases. */
  if ((instruction & UINT32_C(0x7f800000)) == UINT32_C(0x53000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t bits = is_64 ? 64 : 32;
    uint32_t n = (instruction >> 22) & 1;
    uint32_t immr = (instruction >> 16) & 0x3f;
    uint32_t imms = (instruction >> 10) & 0x3f;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (n != is_64 || immr >= bits || imms >= bits) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t value;
    if (imms >= immr) {
      uint32_t field_bits = imms - immr + 1;
      value = (read_register(rn, 0) >> immr) & width_mask(field_bits);
    } else {
      value = (read_register(rn, 0) & width_mask(imms + 1)) << (bits - immr);
    }
    write_register(rd, value, is_64, 0);
    return cpu.status;
  }

  /* Bitfield move. Covers BFI and BFXIL aliases. */
  if ((instruction & UINT32_C(0x7f800000)) == UINT32_C(0x33000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t bits = is_64 ? 64 : 32;
    uint32_t n = (instruction >> 22) & 1;
    uint32_t immr = (instruction >> 16) & 0x3f;
    uint32_t imms = (instruction >> 10) & 0x3f;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (n != is_64 || immr >= bits || imms >= bits) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t source = read_register(rn, 0);
    uint64_t destination = read_register(rd, 0);
    uint64_t mask;
    uint64_t field;
    if (imms >= immr) {
      uint32_t field_bits = imms - immr + 1;
      mask = width_mask(field_bits);
      field = (source >> immr) & mask;
    } else {
      uint32_t field_bits = imms + 1;
      uint32_t lsb = bits - immr;
      mask = width_mask(field_bits) << lsb;
      field = (source & width_mask(field_bits)) << lsb;
    }
    write_register(rd, (destination & ~mask) | field, is_64, 0);
    return cpu.status;
  }

  /* Logical shifted register: AND/BIC, ORR/ORN, EOR/EON and ANDS/BICS. */
  if ((instruction & UINT32_C(0x1f000000)) == UINT32_C(0x0a000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t operation = (instruction >> 29) & 3;
    uint32_t invert = (instruction >> 21) & 1;
    uint32_t shift_type = (instruction >> 22) & 3;
    uint32_t amount = (instruction >> 10) & 0x3f;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    uint32_t bits = is_64 ? 64 : 32;
    if (amount >= bits) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t right = read_register(rm, 0) & width_mask(bits);
    if (shift_type == 0) right <<= amount;
    else if (shift_type == 1) right >>= amount;
    else if (shift_type == 2) right = arithmetic_shift_right(right, amount, bits);
    else right = rotate_right(right, amount, bits);
    if (invert) right = ~right;
    uint64_t left = read_register(rn, 0);
    uint64_t value = operation == 0 || operation == 3 ? left & right : operation == 1 ? left | right : left ^ right;
    write_register(rd, value, is_64, 0);
    if (operation == 3) {
      uint64_t masked = value & width_mask(bits);
      cpu.nzcv = ((masked >> (bits - 1)) << 31) | ((masked == 0) << 30);
    }
    return cpu.status;
  }

  /* LDAR/STLR byte, halfword, word and doubleword. Wasm memory is coherent;
   * the acquire/release ordering is naturally serialized by this interpreter. */
  if ((instruction & UINT32_C(0x3fbffc00)) == UINT32_C(0x089ffc00)) {
    uint32_t size = 1u << (instruction >> 30);
    uint32_t load = (instruction >> 22) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    uint64_t address = read_register(rn, 1);
    if (!address_is_valid(address, size)) return fail(ARM64_FAULT_MEMORY, address);
    if (load) write_register(rt, load_integer(address, size), size == 8, 0);
    else store_integer(address, read_register(rt, 0), size);
    return cpu.status;
  }

  /* Integer LDR/LDRSW literal: signed PC-relative imm19 scaled by four. */
  if ((instruction & UINT32_C(0x3b000000)) == UINT32_C(0x18000000)) {
    uint32_t opc = instruction >> 30;
    uint32_t rt = instruction & 31;
    int64_t offset = (int64_t)sign_extend((instruction >> 5) & 0x7ffff, 19) * 4;
    uint64_t address = instruction_pc + offset;
    uint32_t size = opc == 1 ? 8 : 4;
    if (opc == 3) return cpu.status; /* PRFM literal is only a cache hint. */
    if (!address_is_valid(address, size)) return fail(ARM64_FAULT_MEMORY, address);
    uint64_t value = load_integer(address, size);
    if (opc == 2) value = sign_extend(value, 32);
    write_register(rt, value, opc != 0, 0);
    return cpu.status;
  }

  /* SIMD/FP load/store with unscaled, unprivileged, pre-index or post-index immediate. */
  if (((instruction >> 26) & 1) != 0 && (instruction & UINT32_C(0x3b200000)) == UINT32_C(0x38000000)) {
    uint32_t size = fp_memory_size(instruction);
    uint32_t load = (instruction >> 22) & 1;
    int64_t offset = (int64_t)sign_extend((instruction >> 12) & 0x1ff, 9);
    uint32_t mode = (instruction >> 10) & 3;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    if (size == 0) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t base = read_register(rn, 1);
    uint64_t address = mode == 1 ? base : base + offset;
    if (!address_is_valid(address, size)) return fail(ARM64_FAULT_MEMORY, address);
    if (load) {
      cpu.q_lo[rt] = load_integer(address, size > 8 ? 8 : size);
      cpu.q_hi[rt] = size == 16 ? load_integer(address + 8, 8) : 0;
    } else {
      store_integer(address, cpu.q_lo[rt], size > 8 ? 8 : size);
      if (size == 16) store_integer(address + 8, cpu.q_hi[rt], 8);
    }
    if (mode == 1 || mode == 3) write_register(rn, base + offset, 1, 1);
    return cpu.status;
  }

  /* Integer load/store with unscaled, unprivileged, pre-index or post-index immediate. */
  if (((instruction >> 26) & 1) == 0 && (instruction & UINT32_C(0x3b200000)) == UINT32_C(0x38000000)) {
    uint32_t size_log2 = instruction >> 30;
    uint32_t size = 1u << size_log2;
    uint32_t operation = (instruction >> 22) & 3;
    int64_t offset = (int64_t)sign_extend((instruction >> 12) & 0x1ff, 9);
    uint32_t mode = (instruction >> 10) & 3;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    uint64_t base = read_register(rn, 1);
    uint64_t address = mode == 1 ? base : base + offset;
    if (!address_is_valid(address, size)) return fail(ARM64_FAULT_MEMORY, address);
    if (operation == 0) store_integer(address, read_register(rt, 0), size);
    else if (operation == 1) write_register(rt, load_integer(address, size), size == 8, 0);
    else {
      if (size == 8 || (operation == 3 && size >= 4)) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
      write_register(rt, sign_extend(load_integer(address, size), size * 8), operation == 2, 0);
    }
    if (mode == 1 || mode == 3) write_register(rn, base + offset, 1, 1);
    return cpu.status;
  }

  /* SIMD/FP load/store with register offset. */
  if (((instruction >> 26) & 1) != 0 && (instruction & UINT32_C(0x3b200c00)) == UINT32_C(0x38200800)) {
    uint32_t size = fp_memory_size(instruction);
    uint32_t load = (instruction >> 22) & 1;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t option = (instruction >> 13) & 7;
    uint32_t scaled = (instruction >> 12) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    if (size == 0) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t offset = read_register(rm, 0);
    if (option == 2 || option == 6) offset = (uint32_t)offset;
    if (option == 6) offset = sign_extend(offset, 32);
    else if (option == 7) offset = sign_extend(offset, 64);
    else if (option != 2 && option != 3) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    if (scaled) offset *= size;
    uint64_t address = read_register(rn, 1) + offset;
    if (!address_is_valid(address, size)) return fail(ARM64_FAULT_MEMORY, address);
    if (load) {
      cpu.q_lo[rt] = load_integer(address, size > 8 ? 8 : size);
      cpu.q_hi[rt] = size == 16 ? load_integer(address + 8, 8) : 0;
    } else {
      store_integer(address, cpu.q_lo[rt], size > 8 ? 8 : size);
      if (size == 16) store_integer(address + 8, cpu.q_hi[rt], 8);
    }
    return cpu.status;
  }

  /* Integer load/store with register offset. */
  if (((instruction >> 26) & 1) == 0 && (instruction & UINT32_C(0x3b200c00)) == UINT32_C(0x38200800)) {
    uint32_t size_log2 = instruction >> 30;
    uint32_t size = 1u << size_log2;
    uint32_t operation = (instruction >> 22) & 3;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t option = (instruction >> 13) & 7;
    uint32_t scaled = (instruction >> 12) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    uint64_t offset = read_register(rm, 0);
    if (option == 2 || option == 6) offset = (uint32_t)offset;
    if (option == 6) offset = sign_extend(offset, 32);
    else if (option == 7) offset = sign_extend(offset, 64);
    else if (option != 2 && option != 3) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    if (scaled) offset <<= size_log2;
    uint64_t address = read_register(rn, 1) + offset;
    if (!address_is_valid(address, size)) return fail(ARM64_FAULT_MEMORY, address);
    if (operation == 0) store_integer(address, read_register(rt, 0), size);
    else if (operation == 1) write_register(rt, load_integer(address, size), size == 8, 0);
    else {
      if (size == 8 || (operation == 3 && size >= 4)) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
      write_register(rt, sign_extend(load_integer(address, size), size * 8), operation == 2, 0);
    }
    return cpu.status;
  }

  /* SIMD/FP load/store with unsigned scaled immediate. */
  if (((instruction >> 26) & 1) != 0 && (instruction & UINT32_C(0x3b000000)) == UINT32_C(0x39000000)) {
    uint32_t size = fp_memory_size(instruction);
    uint32_t load = (instruction >> 22) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    if (size == 0) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t address = read_register(rn, 1) + (uint64_t)((instruction >> 10) & 0xfff) * size;
    if (!address_is_valid(address, size)) return fail(ARM64_FAULT_MEMORY, address);
    if (load) {
      cpu.q_lo[rt] = load_integer(address, size > 8 ? 8 : size);
      cpu.q_hi[rt] = size == 16 ? load_integer(address + 8, 8) : 0;
    } else {
      store_integer(address, cpu.q_lo[rt], size > 8 ? 8 : size);
      if (size == 16) store_integer(address + 8, cpu.q_hi[rt], 8);
    }
    return cpu.status;
  }

  /* Integer load/store with unsigned scaled immediate. */
  if (((instruction >> 26) & 1) == 0 && (instruction & UINT32_C(0x3b000000)) == UINT32_C(0x39000000)) {
    uint32_t size_log2 = instruction >> 30;
    uint32_t size = 1u << size_log2;
    uint32_t operation = (instruction >> 22) & 3;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    uint64_t address = read_register(rn, 1) + (uint64_t)((instruction >> 10) & 0xfff) * size;
    if (!address_is_valid(address, size)) return fail(ARM64_FAULT_MEMORY, address);
    if (operation == 0) store_integer(address, read_register(rt, 0), size);
    else if (operation == 1) write_register(rt, load_integer(address, size), size == 8, 0);
    else {
      if (size == 8 || (operation == 3 && size >= 4)) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
      write_register(rt, sign_extend(load_integer(address, size), size * 8), operation == 2, 0);
    }
    return cpu.status;
  }

  /* LDP/STP offset, pre-index and post-index forms for integer registers. */
  if ((instruction & UINT32_C(0x3a000000)) == UINT32_C(0x28000000) && ((instruction >> 26) & 1) == 0) {
    uint32_t opc = instruction >> 30;
    uint32_t signed_words = opc == 1;
    uint32_t size = opc == 2 ? 8 : (opc == 0 || signed_words) ? 4 : 0;
    uint32_t mode = (instruction >> 23) & 3;
    uint32_t load = (instruction >> 22) & 1;
    uint32_t rt2 = (instruction >> 10) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    if (size == 0 || mode == 0 || (signed_words && !load)) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    int64_t offset = (int64_t)sign_extend((instruction >> 15) & 0x7f, 7) * size;
    uint64_t base = read_register(rn, 1);
    uint64_t address = mode == 1 ? base : base + offset;
    if (!address_is_valid(address, size * 2)) return fail(ARM64_FAULT_MEMORY, address);
    if (load) {
      uint64_t first = load_integer(address, size);
      uint64_t second = load_integer(address + size, size);
      write_register(rt, signed_words ? sign_extend(first, 32) : first, size == 8 || signed_words, 0);
      write_register(rt2, signed_words ? sign_extend(second, 32) : second, size == 8 || signed_words, 0);
    } else {
      store_integer(address, read_register(rt, 0), size);
      store_integer(address + size, read_register(rt2, 0), size);
    }
    if (mode == 1 || mode == 3) write_register(rn, base + offset, 1, 1);
    return cpu.status;
  }

  /* SIMD/FP LDP/STP for S, D and Q registers. */
  if ((instruction & UINT32_C(0x3a000000)) == UINT32_C(0x28000000) && ((instruction >> 26) & 1) != 0) {
    uint32_t opc = instruction >> 30;
    uint32_t size = opc == 0 ? 4 : opc == 1 ? 8 : opc == 2 ? 16 : 0;
    uint32_t mode = (instruction >> 23) & 3;
    uint32_t load = (instruction >> 22) & 1;
    uint32_t rt2 = (instruction >> 10) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    if (size == 0 || mode == 0) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    int64_t offset = (int64_t)sign_extend((instruction >> 15) & 0x7f, 7) * size;
    uint64_t base = read_register(rn, 1);
    uint64_t address = mode == 1 ? base : base + offset;
    if (!address_is_valid(address, size * 2)) return fail(ARM64_FAULT_MEMORY, address);
    if (load) {
      cpu.q_lo[rt] = load_integer(address, size > 8 ? 8 : size);
      cpu.q_hi[rt] = size == 16 ? load_integer(address + 8, 8) : 0;
      cpu.q_lo[rt2] = load_integer(address + size, size > 8 ? 8 : size);
      cpu.q_hi[rt2] = size == 16 ? load_integer(address + size + 8, 8) : 0;
    } else {
      store_integer(address, cpu.q_lo[rt], size > 8 ? 8 : size);
      if (size == 16) store_integer(address + 8, cpu.q_hi[rt], 8);
      store_integer(address + size, cpu.q_lo[rt2], size > 8 ? 8 : size);
      if (size == 16) store_integer(address + size + 8, cpu.q_hi[rt2], 8);
    }
    if (mode == 1 || mode == 3) write_register(rn, base + offset, 1, 1);
    return cpu.status;
  }

  return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
}

__attribute__((export_name("arm64_run")))
int32_t arm64_run(uint32_t maximum_steps) {
  while (cpu.status == ARM64_STATUS_RUNNING && maximum_steps-- > 0) arm64_step();
  return cpu.status;
}

__attribute__((export_name("arm64_run_until")))
int32_t arm64_run_until(uint64_t stop_pc, uint32_t maximum_steps) {
  while (cpu.status == ARM64_STATUS_RUNNING && cpu.pc != stop_pc && maximum_steps-- > 0) arm64_step();
  return cpu.status;
}
