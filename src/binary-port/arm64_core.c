#include <stdint.h>

enum {
  ARM64_STATUS_RUNNING = 0,
  ARM64_STATUS_HALTED = 1,
  ARM64_STATUS_SYSCALL = 2,
  ARM64_FAULT_UNKNOWN_INSTRUCTION = -1,
  ARM64_FAULT_MEMORY = -2,
  ARM64_FAULT_ALIGNMENT = -3,
};

typedef struct {
  uint64_t x[31];
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
  return (uint64_t)__builtin_wasm_memory_size(0) * UINT64_C(65536);
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
  if (index < 31) cpu.x[index] = value;
  else if (use_sp) cpu.sp = value;
}

static uint64_t load_integer(uint64_t address, uint32_t size) {
  uint8_t *p = guest_pointer(address);
  uint64_t value = 0;
  for (uint32_t index = 0; index < size; index++) value |= (uint64_t)p[index] << (index * 8);
  return value;
}

static void store_integer(uint64_t address, uint64_t value, uint32_t size) {
  uint8_t *p = guest_pointer(address);
  for (uint32_t index = 0; index < size; index++) p[index] = (uint8_t)(value >> (index * 8));
}

static int32_t fail(int32_t status, uint64_t address) {
  cpu.status = status;
  cpu.fault_address = address;
  return status;
}

__attribute__((export_name("arm64_reset")))
void arm64_reset(uint64_t pc) {
  for (uint32_t index = 0; index < 31; index++) cpu.x[index] = 0;
  cpu.sp = 0;
  cpu.pc = pc;
  cpu.steps = 0;
  cpu.nzcv = 0;
  cpu.last_instruction = 0;
  cpu.status = ARM64_STATUS_RUNNING;
  cpu.fault_address = 0;
}

__attribute__((export_name("arm64_set_memory_bias")))
void arm64_set_memory_bias(uint32_t bias) { cpu.memory_bias = bias; }

__attribute__((export_name("arm64_set_register")))
void arm64_set_register(uint32_t index, uint64_t value) {
  if (index < 31) cpu.x[index] = value;
}

__attribute__((export_name("arm64_get_register")))
uint64_t arm64_get_register(uint32_t index) {
  return index < 31 ? cpu.x[index] : 0;
}

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

__attribute__((export_name("arm64_resume")))
void arm64_resume(void) {
  if (cpu.status == ARM64_STATUS_SYSCALL) cpu.status = ARM64_STATUS_RUNNING;
}

__attribute__((export_name("arm64_step")))
int32_t arm64_step(void) {
  if (cpu.status != ARM64_STATUS_RUNNING) return cpu.status;
  if ((cpu.pc & 3) != 0) return fail(ARM64_FAULT_ALIGNMENT, cpu.pc);
  if (!address_is_valid(cpu.pc, 4)) return fail(ARM64_FAULT_MEMORY, cpu.pc);

  uint64_t instruction_pc = cpu.pc;
  uint32_t instruction = (uint32_t)load_integer(instruction_pc, 4);
  cpu.last_instruction = instruction;
  cpu.pc += 4;
  cpu.steps++;

  /* NOP. */
  if (instruction == UINT32_C(0xd503201f)) return cpu.status;

  /* Supervisor call: stop at the browser syscall boundary after advancing PC. */
  if ((instruction & UINT32_C(0xffe0001f)) == UINT32_C(0xd4000001)) {
    cpu.status = ARM64_STATUS_SYSCALL;
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
    if (branch_class == UINT32_C(0x94000000)) cpu.x[30] = cpu.pc;
    cpu.pc = instruction_pc + offset;
    return cpu.status;
  }

  /* Conditional branch. */
  if ((instruction & UINT32_C(0xff000010)) == UINT32_C(0x54000000)) {
    uint64_t offset = sign_extend((instruction >> 5) & 0x7ffff, 19) << 2;
    if (condition_holds(instruction & 15)) cpu.pc = instruction_pc + offset;
    return cpu.status;
  }

  /* BR, BLR and RET. */
  uint32_t register_branch = instruction & UINT32_C(0xfffffc1f);
  if (register_branch == UINT32_C(0xd61f0000) || register_branch == UINT32_C(0xd63f0000) || register_branch == UINT32_C(0xd65f0000)) {
    uint32_t rn = (instruction >> 5) & 31;
    uint64_t target = read_register(rn, 0);
    if (register_branch == UINT32_C(0xd63f0000)) cpu.x[30] = cpu.pc;
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

  /* ADD/SUB shifted register, LSL form, without flags. */
  if ((instruction & UINT32_C(0x1f200000)) == UINT32_C(0x0b000000)) {
    uint32_t is_64 = instruction >> 31;
    uint32_t subtract = (instruction >> 30) & 1;
    uint32_t set_flags = (instruction >> 29) & 1;
    uint32_t shift_type = (instruction >> 22) & 3;
    uint32_t amount = (instruction >> 10) & 0x3f;
    uint32_t rm = (instruction >> 16) & 31;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rd = instruction & 31;
    if (shift_type != 0 || (!is_64 && amount >= 32)) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint64_t right = read_register(rm, 0) << amount;
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
    if (n != is_64 || immr >= bits || imms >= bits || imms < immr) return fail(ARM64_FAULT_UNKNOWN_INSTRUCTION, instruction_pc);
    uint32_t field_bits = imms - immr + 1;
    uint64_t value = sign_extend((read_register(rn, 0) >> immr) & width_mask(field_bits), field_bits);
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
      value = (read_register(rn, 0) << (bits - immr)) & width_mask(imms + 1);
    }
    write_register(rd, value, is_64, 0);
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
    else if (shift_type == 2) right = (uint64_t)sign_extend(right, bits) >> amount;
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

  /* Integer load/store with unsigned scaled immediate. */
  if ((instruction & UINT32_C(0x3b000000)) == UINT32_C(0x39000000)) {
    uint32_t size_log2 = instruction >> 30;
    uint32_t size = 1u << size_log2;
    uint32_t load = (instruction >> 22) & 1;
    uint32_t rn = (instruction >> 5) & 31;
    uint32_t rt = instruction & 31;
    uint64_t address = read_register(rn, 1) + (uint64_t)((instruction >> 10) & 0xfff) * size;
    if (!address_is_valid(address, size)) return fail(ARM64_FAULT_MEMORY, address);
    if (load) write_register(rt, load_integer(address, size), size == 8, 0);
    else store_integer(address, read_register(rt, 0), size);
    return cpu.status;
  }

  /* LDP/STP offset, pre-index and post-index forms for integer registers. */
  if ((instruction & UINT32_C(0x3a000000)) == UINT32_C(0x28000000) && ((instruction >> 26) & 1) == 0) {
    uint32_t opc = instruction >> 30;
    uint32_t size = opc == 2 ? 8 : opc == 0 ? 4 : 0;
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
      write_register(rt, load_integer(address, size), size == 8, 0);
      write_register(rt2, load_integer(address + size, size), size == 8, 0);
    } else {
      store_integer(address, read_register(rt, 0), size);
      store_integer(address + size, read_register(rt2, 0), size);
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
