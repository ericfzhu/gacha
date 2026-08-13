#include <stdint.h>
#include <stdarg.h>

/*
 * Structural AArch64 ELF used while the browser host supplies Android ABI
 * behavior. Individual system-library copies receive their own DT_SONAME.
 */
__attribute__((visibility("default")))
uint64_t __libpad_browser_android_stub(void) {
  return 0;
}

#if BROWSER_LIBC
static int browser_errno;
static char browser_environment_name[64];
static char browser_environment_value[128];

__attribute__((visibility("default"), naked))
void browser_constructor_return(void) {
  __asm__ volatile("mov x30, #-1\nret");
}

static int strings_equal(const char *left, const char *right) {
  while (*left && *left == *right) { left += 1; right += 1; }
  return *left == *right;
}

__attribute__((visibility("default")))
int strcmp(const char *left, const char *right) {
  while (*left && *left == *right) { left += 1; right += 1; }
  return (int)(uint8_t)*left - (int)(uint8_t)*right;
}

__attribute__((visibility("default")))
char *strstr(const char *haystack, const char *needle) {
  if (!haystack || !needle) return (char *)0;
  if (!needle[0]) return (char *)haystack;
  for (; *haystack; haystack += 1) {
    const char *left = haystack;
    const char *right = needle;
    while (*right && *left == *right) { left += 1; right += 1; }
    if (!*right) return (char *)haystack;
  }
  return (char *)0;
}

static void copy_string(char *destination, uint64_t capacity, const char *source) {
  uint64_t index = 0;
  if (!capacity) return;
  while (source[index] && index + 1 < capacity) {
    destination[index] = source[index];
    index += 1;
  }
  destination[index] = 0;
}

__attribute__((visibility("default")))
int *__errno(void) {
  return &browser_errno;
}

__attribute__((visibility("default")))
char *getenv(const char *name) {
  if (name && browser_environment_name[0] && strings_equal(name, browser_environment_name)) {
    return browser_environment_value;
  }
  if (name && strings_equal(name, "ANDROID_ROOT")) return "/system";
  if (name && strings_equal(name, "ANDROID_DATA")) return "/data";
  if (name && strings_equal(name, "PATH")) return "/system/bin:/system/xbin";
  if (name && strings_equal(name, "TMPDIR")) return "/data/local/tmp";
  return (char *)0;
}

__attribute__((visibility("default")))
int setenv(const char *name, const char *value, int overwrite) {
  if (!name || !value || !name[0]) {
    browser_errno = 22;
    return -1;
  }
  if (!overwrite && browser_environment_name[0] && strings_equal(name, browser_environment_name)) return 0;
  copy_string(browser_environment_name, sizeof(browser_environment_name), name);
  copy_string(browser_environment_value, sizeof(browser_environment_value), value);
  return 0;
}

typedef struct {
  int64_t seconds;
  int64_t nanoseconds;
} BrowserTimespec;

typedef struct {
  int64_t seconds;
  int64_t microseconds;
} BrowserTimeval;

/* Android supplies an advancing kernel clock.  A fixed timestamp causes the
 * native frame pacer to spin forever while waiting for the next millisecond.
 * Keep this guest-side fallback deterministic and monotonic; one millisecond
 * per observation matches the resolution libpad uses for its pacing loop. */
static uint64_t browser_time_microseconds = UINT64_C(1720000000000000);

__attribute__((visibility("default")))
void browser_set_time_microseconds(uint64_t value) {
  if (value > browser_time_microseconds) browser_time_microseconds = value;
}

static uint64_t read_browser_time(void) {
  uint64_t result = browser_time_microseconds;
  browser_time_microseconds += 1000;
  return result;
}

__attribute__((visibility("default")))
int clock_gettime(int clock_id, BrowserTimespec *value) {
  (void)clock_id;
  if (!value) {
    browser_errno = 14;
    return -1;
  }
  uint64_t now = read_browser_time();
  value->seconds = (int64_t)(now / 1000000);
  value->nanoseconds = (int64_t)((now % 1000000) * 1000);
  return 0;
}

__attribute__((visibility("default")))
int gettimeofday(BrowserTimeval *value, void *timezone) {
  (void)timezone;
  if (!value) {
    browser_errno = 14;
    return -1;
  }
  uint64_t now = read_browser_time();
  value->seconds = (int64_t)(now / 1000000);
  value->microseconds = (int64_t)(now % 1000000);
  return 0;
}

__attribute__((visibility("default")))
int gettid(void) {
  return 4242;
}

__attribute__((visibility("default")))
int getuid(void) {
  return 10000;
}

__attribute__((visibility("default")))
int getgid(void) {
  return 10000;
}

__attribute__((visibility("default")))
int prctl(int option, ...) {
  (void)option;
  return 0;
}

__attribute__((visibility("default")))
int sigaction(int signal_number, const void *action, void *old_action) {
  (void)signal_number;
  (void)action;
  (void)old_action;
  return 0;
}

__attribute__((visibility("default")))
int sigemptyset(uint64_t *set) {
  if (!set) { browser_errno = 14; return -1; }
  *set = 0;
  return 0;
}

__attribute__((visibility("default")))
int64_t time(int64_t *result) {
  const int64_t now = (int64_t)(read_browser_time() / 1000000);
  if (result) *result = now;
  return now;
}

typedef struct {
  int descriptor;
  int active;
} BrowserFile;

static BrowserFile browser_files[4];
__attribute__((visibility("default"))) uint64_t browser_last_write_caller;
__attribute__((visibility("default"))) uint64_t browser_last_sprintf_caller;
__attribute__((visibility("default"))) uint64_t browser_last_system_caller;
__attribute__((visibility("default"))) uint64_t browser_last_mprotect_caller;
__attribute__((visibility("default"))) uint64_t browser_last_mprotect_address;
__attribute__((visibility("default"))) uint64_t browser_last_mprotect_length;
__attribute__((visibility("default"))) uint64_t browser_last_mprotect_protection;
__attribute__((visibility("default"))) uint64_t browser_last_exit_caller;
__attribute__((visibility("default"))) uint64_t browser_last_abort_caller;
__attribute__((visibility("default"))) char browser_last_system_command[512];
__attribute__((visibility("default"))) uint64_t browser_fork_count;
__attribute__((visibility("default"))) uint64_t browser_last_fork_caller;
__attribute__((visibility("default"))) uint64_t browser_waitpid_count;
__attribute__((visibility("default"))) uint64_t browser_last_waitpid_caller;

typedef struct {
  int descriptor;
  int active;
  uint8_t entry[280];
} BrowserDirectory;

static BrowserDirectory browser_directories[4];

static int64_t browser_syscall3(uint64_t number, uint64_t argument0, uint64_t argument1, uint64_t argument2) {
  register uint64_t x0 __asm__("x0") = argument0;
  register uint64_t x1 __asm__("x1") = argument1;
  register uint64_t x2 __asm__("x2") = argument2;
  register uint64_t x8 __asm__("x8") = number;
  __asm__ volatile("svc #0" : "+r"(x0) : "r"(x1), "r"(x2), "r"(x8) : "memory");
  return (int64_t)x0;
}

static int64_t browser_syscall4(uint64_t number, uint64_t argument0, uint64_t argument1,
                                uint64_t argument2, uint64_t argument3) {
  register uint64_t x0 __asm__("x0") = argument0;
  register uint64_t x1 __asm__("x1") = argument1;
  register uint64_t x2 __asm__("x2") = argument2;
  register uint64_t x3 __asm__("x3") = argument3;
  register uint64_t x8 __asm__("x8") = number;
  __asm__ volatile("svc #0" : "+r"(x0) : "r"(x1), "r"(x2), "r"(x3), "r"(x8) : "memory");
  return (int64_t)x0;
}

static int64_t browser_syscall6(uint64_t number, uint64_t argument0, uint64_t argument1,
                                uint64_t argument2, uint64_t argument3, uint64_t argument4,
                                uint64_t argument5) {
  register uint64_t x0 __asm__("x0") = argument0;
  register uint64_t x1 __asm__("x1") = argument1;
  register uint64_t x2 __asm__("x2") = argument2;
  register uint64_t x3 __asm__("x3") = argument3;
  register uint64_t x4 __asm__("x4") = argument4;
  register uint64_t x5 __asm__("x5") = argument5;
  register uint64_t x8 __asm__("x8") = number;
  __asm__ volatile("svc #0" : "+r"(x0) : "r"(x1), "r"(x2), "r"(x3), "r"(x4), "r"(x5), "r"(x8) : "memory");
  return (int64_t)x0;
}

__attribute__((visibility("default")))
int fchmod(int descriptor, uint32_t mode) {
  return (int)browser_syscall3(52, (uint64_t)descriptor, mode, 0);
}

__attribute__((visibility("default")))
int64_t read(int descriptor, void *buffer, uint64_t count) {
  return browser_syscall3(63, (uint64_t)descriptor, (uint64_t)buffer, count);
}

__attribute__((visibility("default")))
int64_t write(int descriptor, const void *buffer, uint64_t count) {
  browser_last_write_caller = (uint64_t)__builtin_return_address(0);
  return browser_syscall3(64, (uint64_t)descriptor, (uint64_t)buffer, count);
}

__attribute__((visibility("default")))
int64_t lseek(int descriptor, int64_t offset, int whence) {
  return browser_syscall3(62, (uint64_t)descriptor, (uint64_t)offset, (uint64_t)whence);
}

__attribute__((visibility("default")))
int open(const char *path, int flags, ...) {
  uint64_t mode = 0;
  if (flags & 0x40) {
    va_list arguments;
    va_start(arguments, flags);
    mode = va_arg(arguments, uint32_t);
    va_end(arguments);
  }
  return (int)browser_syscall4(56, (uint64_t)-100, (uint64_t)path, (uint64_t)flags, mode);
}

__attribute__((visibility("default")))
int close(int descriptor) {
  return (int)browser_syscall3(57, (uint64_t)descriptor, 0, 0);
}

__attribute__((visibility("default")))
int unlink(const char *path) {
  return (int)browser_syscall3(35, (uint64_t)-100, (uint64_t)path, 0);
}

__attribute__((visibility("default")))
int rmdir(const char *path) {
  return (int)browser_syscall3(35, (uint64_t)-100, (uint64_t)path, 0x200);
}

__attribute__((visibility("default")))
int fcntl(int descriptor, int command, ...) {
  uint64_t argument = 0;
  switch (command) {
    case 0:    /* F_DUPFD */
    case 2:    /* F_SETFD */
    case 4:    /* F_SETFL */
    case 5:    /* F_GETLK */
    case 6:    /* F_SETLK */
    case 7:    /* F_SETLKW */
    case 1030: /* F_DUPFD_CLOEXEC */ {
      va_list arguments;
      va_start(arguments, command);
      argument = va_arg(arguments, uint64_t);
      va_end(arguments);
      break;
    }
    default:
      break;
  }
  return (int)browser_syscall3(25, (uint64_t)descriptor, (uint64_t)command, argument);
}

__attribute__((visibility("default")))
int inotify_init1(int flags) {
  return (int)browser_syscall3(26, (uint64_t)flags, 0, 0);
}

__attribute__((visibility("default")))
int inotify_init(void) {
  return inotify_init1(0);
}

__attribute__((visibility("default")))
int inotify_add_watch(int descriptor, const char *path, uint32_t mask) {
  return (int)browser_syscall3(27, (uint64_t)descriptor, (uint64_t)path, mask);
}

__attribute__((visibility("default")))
int inotify_rm_watch(int descriptor, int watch) {
  return (int)browser_syscall3(28, (uint64_t)descriptor, (uint64_t)watch, 0);
}

__attribute__((visibility("default")))
int getpid(void) {
  return (int)browser_syscall3(172, 0, 0, 0);
}

__attribute__((visibility("default")))
BrowserDirectory *opendir(const char *path) {
  int descriptor = (int)browser_syscall4(56, (uint64_t)-100, (uint64_t)path, 0, 0);
  if (descriptor < 0) return (BrowserDirectory *)0;
  for (uint32_t index = 0; index < sizeof(browser_directories) / sizeof(browser_directories[0]); index++) {
    if (!browser_directories[index].active) {
      browser_directories[index].descriptor = descriptor;
      browser_directories[index].active = 1;
      return &browser_directories[index];
    }
  }
  browser_syscall3(57, (uint64_t)descriptor, 0, 0);
  return (BrowserDirectory *)0;
}

__attribute__((visibility("default")))
void *readdir(BrowserDirectory *directory) {
  if (!directory || !directory->active) return (void *)0;
  int64_t length = browser_syscall3(61, (uint64_t)directory->descriptor,
                                    (uint64_t)directory->entry, sizeof(directory->entry));
  return length > 0 ? directory->entry : (void *)0;
}

__attribute__((visibility("default")))
int closedir(BrowserDirectory *directory) {
  if (!directory || !directory->active) return -1;
  int result = (int)browser_syscall3(57, (uint64_t)directory->descriptor, 0, 0);
  directory->active = 0;
  return result;
}

__attribute__((visibility("default")))
void rewinddir(BrowserDirectory *directory) {
  if (directory && directory->active) browser_syscall3(62, (uint64_t)directory->descriptor, 0, 0);
}

__attribute__((visibility("default")))
BrowserFile *fopen(const char *path, const char *mode) {
  uint64_t flags = mode && mode[0] == 'r' ? 0 : 577;
  int descriptor = (int)browser_syscall4(56, (uint64_t)-100, (uint64_t)path, flags, 0644);
  if (descriptor < 0) {
    browser_errno = -descriptor;
    return (BrowserFile *)0;
  }
  for (uint32_t index = 0; index < sizeof(browser_files) / sizeof(browser_files[0]); index++) {
    if (!browser_files[index].active) {
      browser_files[index].descriptor = descriptor;
      browser_files[index].active = 1;
      return &browser_files[index];
    }
  }
  browser_syscall3(57, (uint64_t)descriptor, 0, 0);
  browser_errno = 24;
  return (BrowserFile *)0;
}

__attribute__((visibility("default")))
char *fgets(char *output, int capacity, BrowserFile *file) {
  if (!output || capacity <= 1 || !file || !file->active) return (char *)0;
  int length = 0;
  while (length + 1 < capacity) {
    int64_t count = browser_syscall3(63, (uint64_t)file->descriptor, (uint64_t)&output[length], 1);
    if (count <= 0) break;
    if (output[length++] == '\n') break;
  }
  if (!length) return (char *)0;
  output[length] = 0;
  return output;
}

__attribute__((visibility("default")))
int fclose(BrowserFile *file) {
  if (!file || !file->active) {
    browser_errno = 9;
    return -1;
  }
  int result = (int)browser_syscall3(57, (uint64_t)file->descriptor, 0, 0);
  file->active = 0;
  return result;
}

__attribute__((visibility("default")))
int ferror(BrowserFile *file) {
  (void)file;
  return 0;
}

__attribute__((visibility("default")))
int fileno(BrowserFile *file) {
  if (!file || !file->active) {
    browser_errno = 9;
    return -1;
  }
  return file->descriptor;
}

__attribute__((visibility("default")))
int fseek(BrowserFile *file, int64_t offset, int whence) {
  if (!file || !file->active) { browser_errno = 9; return -1; }
  return lseek(file->descriptor, offset, whence) < 0 ? -1 : 0;
}

__attribute__((visibility("default")))
int fgetpos(BrowserFile *file, int64_t *position) {
  if (!file || !file->active) { browser_errno = 9; return -1; }
  if (!position) { browser_errno = 22; return -1; }
  int64_t offset = lseek(file->descriptor, 0, 1);
  if (offset < 0) { browser_errno = (int)-offset; return -1; }
  *position = offset;
  return 0;
}

__attribute__((visibility("default")))
uint64_t fread(void *output, uint64_t size, uint64_t count, BrowserFile *file) {
  if (!size || !count) return 0;
  if (!file || !file->active || count > UINT64_MAX / size) { browser_errno = 22; return 0; }
  int64_t bytes = read(file->descriptor, output, size * count);
  return bytes > 0 ? (uint64_t)bytes / size : 0;
}

__attribute__((visibility("default")))
uint64_t fwrite(const void *input, uint64_t size, uint64_t count, BrowserFile *file) {
  if (!size || !count) return 0;
  if (!file || !file->active || count > UINT64_MAX / size) { browser_errno = 22; return 0; }
  int64_t bytes = write(file->descriptor, input, size * count);
  return bytes > 0 ? (uint64_t)bytes / size : 0;
}

static void append_character(char *output, uint64_t capacity, uint64_t *length, char value) {
  if (*length + 1 < capacity) output[*length] = value;
  *length += 1;
}

static void append_unsigned(char *output, uint64_t capacity, uint64_t *length,
                            uint64_t value, uint32_t base, int width, char padding) {
  char digits[32];
  int count = 0;
  do {
    uint32_t digit = (uint32_t)(value % base);
    digits[count++] = (char)(digit < 10 ? '0' + digit : 'a' + digit - 10);
    value /= base;
  } while (value && count < (int)sizeof(digits));
  while (count < width) {
    append_character(output, capacity, length, padding);
    width -= 1;
  }
  while (count) append_character(output, capacity, length, digits[--count]);
}

__attribute__((visibility("default")))
int vsnprintf(char *output, uint64_t capacity, const char *format, va_list arguments) {
  uint64_t length = 0;
  va_list args;
  va_copy(args, arguments);
  for (uint64_t index = 0; format && format[index]; index++) {
    if (format[index] != '%') {
      append_character(output, capacity, &length, format[index]);
      continue;
    }
    index += 1;
    if (format[index] == '%') {
      append_character(output, capacity, &length, '%');
      continue;
    }
    char padding = ' ';
    int alternate = 0;
    int left_aligned = 0;
    int show_sign = 0;
    for (;;) {
      if (format[index] == '#') alternate = 1;
      else if (format[index] == '-') left_aligned = 1;
      else if (format[index] == '+') show_sign = 1;
      else if (format[index] == '0') padding = '0';
      else if (format[index] == ' ') { }
      else break;
      index += 1;
    }
    int width = 0;
    if (format[index] == '*') {
      width = va_arg(args, int);
      index += 1;
    } else {
      while (format[index] >= '0' && format[index] <= '9') {
        width = width * 10 + format[index++] - '0';
      }
    }
    int size_t_value = 0;
    if (format[index] == 'z') { size_t_value = 1; index += 1; }
    else if (format[index] == 'l') {
      size_t_value = 1;
      index += 1;
      if (format[index] == 'l') index += 1;
    }
    char specifier = format[index];
    if (specifier == 's') {
      const char *value = va_arg(args, const char *);
      if (!value) value = "(null)";
      int value_length = 0;
      while (value[value_length]) value_length += 1;
      if (!left_aligned) while (value_length < width--) append_character(output, capacity, &length, ' ');
      while (*value) append_character(output, capacity, &length, *value++);
      if (left_aligned) while (value_length < width--) append_character(output, capacity, &length, ' ');
    } else if (specifier == 'd' || specifier == 'i') {
      int64_t value = size_t_value ? va_arg(args, int64_t) : va_arg(args, int);
      if (value < 0) {
        append_character(output, capacity, &length, '-');
        value = -value;
        if (width) width -= 1;
      } else if (show_sign) {
        append_character(output, capacity, &length, '+');
        if (width) width -= 1;
      }
      append_unsigned(output, capacity, &length, (uint64_t)value, 10, width, padding);
    } else if (specifier == 'u' || specifier == 'x' || specifier == 'X') {
      uint64_t value = size_t_value ? va_arg(args, uint64_t) : va_arg(args, unsigned int);
      if (alternate && specifier != 'u' && value) {
        append_character(output, capacity, &length, '0');
        append_character(output, capacity, &length, specifier == 'X' ? 'X' : 'x');
        if (width >= 2) width -= 2;
      }
      append_unsigned(output, capacity, &length, value, specifier == 'u' ? 10 : 16, width, padding);
    } else if (specifier == 'c') {
      append_character(output, capacity, &length, (char)va_arg(args, int));
    } else if (specifier == 'p') {
      append_character(output, capacity, &length, '0');
      append_character(output, capacity, &length, 'x');
      append_unsigned(output, capacity, &length, (uint64_t)va_arg(args, void *), 16, width, '0');
    } else {
      append_character(output, capacity, &length, '%');
      append_character(output, capacity, &length, specifier);
    }
  }
  va_end(args);
  if (capacity) output[length < capacity ? length : capacity - 1] = 0;
  return (int)length;
}

__attribute__((visibility("default")))
int snprintf(char *output, uint64_t capacity, const char *format, ...) {
  va_list arguments;
  va_start(arguments, format);
  int result = vsnprintf(output, capacity, format, arguments);
  va_end(arguments);
  return result;
}

__attribute__((visibility("default")))
int sprintf(char *output, const char *format, ...) {
  browser_last_sprintf_caller = (uint64_t)__builtin_return_address(0);
  va_list arguments;
  va_start(arguments, format);
  int result = vsnprintf(output, (uint64_t)-1, format, arguments);
  va_end(arguments);
  return result;
}

static int scan_space(char value) {
  return value == ' ' || value == '\t' || value == '\n' || value == '\r' || value == '\f' || value == '\v';
}

static int scan_digit(char value, uint32_t base) {
  uint32_t digit;
  if (value >= '0' && value <= '9') digit = (uint32_t)(value - '0');
  else if (value >= 'a' && value <= 'f') digit = (uint32_t)(value - 'a' + 10);
  else if (value >= 'A' && value <= 'F') digit = (uint32_t)(value - 'A' + 10);
  else return -1;
  return digit < base ? (int)digit : -1;
}

__attribute__((visibility("default")))
int sscanf(const char *input, const char *format, ...) {
  if (!input || !format) return -1;
  const char *source = input;
  int assigned = 0;
  va_list arguments;
  va_start(arguments, format);

  while (*format) {
    if (scan_space(*format)) {
      while (scan_space(*format)) format += 1;
      while (scan_space(*source)) source += 1;
      continue;
    }
    if (*format != '%') {
      if (*source != *format) break;
      source += 1;
      format += 1;
      continue;
    }

    format += 1;
    if (*format == '%') {
      if (*source != '%') break;
      source += 1;
      format += 1;
      continue;
    }

    int suppress = 0;
    if (*format == '*') { suppress = 1; format += 1; }
    uint32_t width = 0;
    while (*format >= '0' && *format <= '9') width = width * 10 + (uint32_t)(*format++ - '0');
    int length = 0;
    if (*format == 'h') {
      length = -1;
      format += 1;
      if (*format == 'h') { length = -2; format += 1; }
    } else if (*format == 'l') {
      length = 1;
      format += 1;
      if (*format == 'l') { length = 2; format += 1; }
    } else if (*format == 'z') {
      length = 2;
      format += 1;
    }

    char specifier = *format++;
    if (specifier != 'c') while (scan_space(*source)) source += 1;

    if (specifier == 's') {
      uint32_t remaining = width ? width : 0x7fffffffU;
      const char *start = source;
      char *destination = suppress ? (char *)0 : va_arg(arguments, char *);
      while (*source && !scan_space(*source) && remaining) {
        if (!suppress) *destination++ = *source;
        source += 1;
        remaining -= 1;
      }
      if (source == start) break;
      if (!suppress) {
        *destination = 0;
        assigned += 1;
      }
      continue;
    }

    if (specifier == 'c') {
      uint32_t count = width ? width : 1;
      const char *start = source;
      char *destination = suppress ? (char *)0 : va_arg(arguments, char *);
      while (*source && count) {
        if (!suppress) *destination++ = *source;
        source += 1;
        count -= 1;
      }
      if (source == start || count) break;
      if (!suppress) assigned += 1;
      continue;
    }

    if (specifier == 'd' || specifier == 'i' || specifier == 'u' || specifier == 'x' || specifier == 'X' || specifier == 'o') {
      uint32_t remaining = width ? width : 0x7fffffffU;
      int negative = 0;
      if (remaining && (*source == '+' || *source == '-')) {
        negative = *source == '-';
        source += 1;
        remaining -= 1;
      }
      uint32_t base = specifier == 'o' ? 8 : ((specifier == 'x' || specifier == 'X') ? 16 : 10);
      if (specifier == 'i' && remaining && source[0] == '0') {
        base = (remaining > 1 && (source[1] == 'x' || source[1] == 'X')) ? 16 : 8;
      }
      if (base == 16 && remaining > 1 && source[0] == '0' && (source[1] == 'x' || source[1] == 'X')) {
        source += 2;
        remaining -= 2;
      }
      uint64_t value = 0;
      uint32_t digits = 0;
      int digit;
      while (remaining && (digit = scan_digit(*source, base)) >= 0) {
        value = value * base + (uint32_t)digit;
        source += 1;
        remaining -= 1;
        digits += 1;
      }
      if (!digits) break;
      if (!suppress) {
        void *destination = va_arg(arguments, void *);
        int signed_value = specifier == 'd' || specifier == 'i';
        uint64_t stored = negative ? (uint64_t)(-(int64_t)value) : value;
        if (length == -2) *(uint8_t *)destination = (uint8_t)stored;
        else if (length == -1) *(uint16_t *)destination = (uint16_t)stored;
        else if (length > 0) *(uint64_t *)destination = stored;
        else if (signed_value) *(int32_t *)destination = (int32_t)stored;
        else *(uint32_t *)destination = (uint32_t)stored;
        assigned += 1;
      }
      continue;
    }

    break;
  }

  va_end(arguments);
  return assigned ? assigned : (*input ? 0 : -1);
}

__attribute__((visibility("default")))
int system(const char *command) {
  browser_last_system_caller = (uint64_t)__builtin_return_address(0);
  if (!command) return 1;
  copy_string(browser_last_system_command, sizeof(browser_last_system_command), command);
  return 0;
}

__attribute__((visibility("default")))
int mprotect(void *address, uint64_t length, int protection) {
  browser_last_mprotect_caller = (uint64_t)__builtin_return_address(0);
  browser_last_mprotect_address = (uint64_t)address;
  browser_last_mprotect_length = length;
  browser_last_mprotect_protection = (uint64_t)protection;
  return (int)browser_syscall3(226, (uint64_t)address, length, (uint64_t)protection);
}

__attribute__((visibility("default")))
void *mmap(void *address, uint64_t length, int protection, int flags, int descriptor, uint64_t offset) {
  int64_t result = browser_syscall6(222, (uint64_t)address, length, (uint64_t)protection,
                                    (uint64_t)flags, (uint64_t)descriptor, offset);
  if (result < 0) { browser_errno = (int)-result; return (void *)-1; }
  return (void *)(uint64_t)result;
}

__attribute__((visibility("default")))
int munmap(void *address, uint64_t length) {
  return (int)browser_syscall3(215, (uint64_t)address, length, 0);
}

__attribute__((visibility("default")))
void *malloc(uint64_t size) {
  if (!size) size = 1;
  if (size > UINT64_MAX - 16) { browser_errno = 12; return (void *)0; }
  uint64_t mapped = (size + 16 + 4095) & ~(uint64_t)4095;
  uint64_t *base = (uint64_t *)mmap((void *)0, mapped, 3, 0x22, -1, 0);
  if (base == (void *)-1) return (void *)0;
  base[0] = mapped;
  base[1] = size;
  return base + 2;
}

__attribute__((visibility("default")))
void *calloc(uint64_t count, uint64_t size) {
  if (size && count > UINT64_MAX / size) { browser_errno = 12; return (void *)0; }
  uint64_t total = count * size;
  uint8_t *output = (uint8_t *)malloc(total);
  if (!output) return (void *)0;
  for (uint64_t index = 0; index < total; index++) output[index] = 0;
  return output;
}

__attribute__((visibility("default")))
void free(void *pointer) {
  if (!pointer) return;
  uint64_t *base = (uint64_t *)pointer - 2;
  munmap(base, base[0]);
}

__attribute__((visibility("default")))
void *realloc(void *pointer, uint64_t size) {
  if (!pointer) return malloc(size);
  if (!size) { free(pointer); return (void *)0; }
  uint64_t old_size = ((uint64_t *)pointer)[-1];
  void *replacement = malloc(size);
  if (!replacement) return (void *)0;
  uint64_t copy_size = old_size < size ? old_size : size;
  for (uint64_t index = 0; index < copy_size; index++) ((uint8_t *)replacement)[index] = ((uint8_t *)pointer)[index];
  free(pointer);
  return replacement;
}

__attribute__((visibility("default")))
int kill(int process, int signal) {
  return (int)browser_syscall3(129, (uint64_t)process, (uint64_t)signal, 0);
}

__attribute__((visibility("default"), noreturn))
void _exit(int code) {
  browser_last_exit_caller = (uint64_t)__builtin_return_address(0);
  browser_syscall3(94, (uint64_t)code, 0, 0);
  for (;;) { }
}

__attribute__((visibility("default"), noreturn))
void exit(int code) {
  _exit(code);
}

__attribute__((visibility("default"), noreturn))
void abort(void) {
  browser_last_abort_caller = (uint64_t)__builtin_return_address(0);
  browser_syscall3(94, 134, 0, 0);
  for (;;) { }
}

typedef struct {
  int32_t second;
  int32_t minute;
  int32_t hour;
  int32_t month_day;
  int32_t month;
  int32_t year;
  int32_t week_day;
  int32_t year_day;
  int32_t daylight_saving;
  int64_t utc_offset;
  const char *zone;
} BrowserTm;

static int64_t floor_divide(int64_t value, int64_t divisor) {
  int64_t quotient = value / divisor;
  int64_t remainder = value % divisor;
  if (remainder < 0) quotient -= 1;
  return quotient;
}

static int leap_year(int64_t year) {
  return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
}

/* Howard Hinnant's civil-calendar conversion, expressed without libc so the
 * same UTC epoch is observed by every guest-side time API. */
static int64_t days_from_civil(int64_t year, uint32_t month, uint32_t day) {
  year -= month <= 2;
  int64_t era = floor_divide(year, 400);
  uint32_t year_of_era = (uint32_t)(year - era * 400);
  uint32_t day_of_year = (153 * (month + (month > 2 ? (uint32_t)-3 : 9)) + 2) / 5 + day - 1;
  uint32_t day_of_era = year_of_era * 365 + year_of_era / 4 - year_of_era / 100 + day_of_year;
  return era * 146097 + (int64_t)day_of_era - 719468;
}

static BrowserTm *break_down_utc(const int64_t *value) {
  static const char zone[] = "UTC";
  static BrowserTm result;
  int64_t seconds = value ? *value : (int64_t)(browser_time_microseconds / 1000000);
  int64_t days = floor_divide(seconds, 86400);
  int64_t day_seconds = seconds - days * 86400;
  int64_t adjusted = days + 719468;
  int64_t era = floor_divide(adjusted, 146097);
  uint32_t day_of_era = (uint32_t)(adjusted - era * 146097);
  uint32_t year_of_era = (day_of_era - day_of_era / 1460 + day_of_era / 36524 - day_of_era / 146096) / 365;
  int64_t year = (int64_t)year_of_era + era * 400;
  uint32_t day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
  uint32_t month_piece = (5 * day_of_year + 2) / 153;
  uint32_t day = day_of_year - (153 * month_piece + 2) / 5 + 1;
  uint32_t month = month_piece + (month_piece < 10 ? 3 : (uint32_t)-9);
  year += month <= 2;
  static const uint16_t days_before_month[12] = { 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 };
  result.second = (int32_t)(day_seconds % 60);
  result.minute = (int32_t)((day_seconds / 60) % 60);
  result.hour = (int32_t)(day_seconds / 3600);
  result.month_day = (int32_t)day;
  result.month = (int32_t)month - 1;
  result.year = (int32_t)year - 1900;
  result.week_day = (int32_t)((days + 4) % 7);
  if (result.week_day < 0) result.week_day += 7;
  result.year_day = days_before_month[result.month] + result.month_day - 1 +
                    (result.month > 1 && leap_year(year));
  result.daylight_saving = 0;
  result.utc_offset = 0;
  result.zone = zone;
  return &result;
}

__attribute__((visibility("default")))
BrowserTm *localtime(const int64_t *value) {
  return break_down_utc(value);
}

__attribute__((visibility("default")))
BrowserTm *gmtime(const int64_t *value) {
  return break_down_utc(value);
}

__attribute__((visibility("default")))
int64_t mktime(BrowserTm *value) {
  if (!value) { browser_errno = 14; return -1; }
  int64_t year = (int64_t)value->year + 1900;
  int64_t month_index = value->month;
  year += floor_divide(month_index, 12);
  month_index -= floor_divide(month_index, 12) * 12;
  int64_t result = days_from_civil(year, (uint32_t)month_index + 1, 1) * 86400 +
                   ((int64_t)value->month_day - 1) * 86400 +
                   (int64_t)value->hour * 3600 + (int64_t)value->minute * 60 + value->second;
  BrowserTm normalized = *break_down_utc(&result);
  *value = normalized;
  return result;
}

__attribute__((visibility("default")))
int statfs(const char *path, void *output) {
  if (!path || !output) { browser_errno = 14; return -1; }
  uint64_t *fields = (uint64_t *)output;
  for (uint32_t index = 0; index < 15; index++) fields[index] = 0;
  fields[0] = 0xef53;
  fields[1] = 4096;
  fields[2] = 0x100000;
  fields[3] = 0x80000;
  fields[4] = 0x80000;
  fields[6] = 0x10000;
  fields[7] = 0x8000;
  fields[9] = 255;
  return 0;
}

__attribute__((visibility("default")))
int __android_log_write(int priority, const char *tag, const char *text) {
  (void)priority;
  (void)tag;
  (void)text;
  return 0;
}

__attribute__((visibility("default")))
int socket(int domain, int type, int protocol) {
  (void)domain; (void)type; (void)protocol;
  browser_errno = 101;
  return -1;
}

__attribute__((visibility("default")))
int connect(int descriptor, const void *address, uint32_t length) {
  (void)descriptor; (void)address; (void)length;
  browser_errno = 101;
  return -1;
}

__attribute__((visibility("default")))
int bind(int descriptor, const void *address, uint32_t length) {
  (void)descriptor; (void)address; (void)length;
  browser_errno = 101;
  return -1;
}

__attribute__((visibility("default")))
int listen(int descriptor, int backlog) {
  (void)descriptor; (void)backlog;
  browser_errno = 95;
  return -1;
}

__attribute__((visibility("default")))
int accept(int descriptor, void *address, uint32_t *length) {
  (void)descriptor; (void)address; (void)length;
  browser_errno = 11;
  return -1;
}

__attribute__((visibility("default")))
int64_t sendmsg(int descriptor, const void *message, int flags) {
  (void)descriptor; (void)message; (void)flags;
  browser_errno = 101;
  return -1;
}

__attribute__((visibility("default")))
int64_t recvmsg(int descriptor, void *message, int flags) {
  (void)descriptor; (void)message; (void)flags;
  browser_errno = 11;
  return -1;
}

__attribute__((visibility("default")))
void *__cmsg_nxthdr(const void *message, const void *control_message) {
  (void)message; (void)control_message;
  return (void *)0;
}

__attribute__((visibility("default")))
int setsockopt(int descriptor, int level, int option, const void *value, uint32_t length) {
  (void)descriptor; (void)level; (void)option; (void)value; (void)length;
  browser_errno = 92;
  return -1;
}

__attribute__((visibility("default")))
int waitpid(int process, int *status, int options) {
  browser_waitpid_count += 1;
  browser_last_waitpid_caller = (uint64_t)__builtin_return_address(0);
  (void)process; (void)status; (void)options;
  browser_errno = 10;
  return -1;
}

__attribute__((visibility("default")))
char *realpath(const char *path, char *resolved) {
  if (!path || !resolved) { browser_errno = 22; return (char *)0; }
  copy_string(resolved, 4096, path);
  return resolved;
}

__attribute__((visibility("default")))
int fork(void) {
  browser_fork_count += 1;
  browser_last_fork_caller = (uint64_t)__builtin_return_address(0);
  browser_errno = 11;
  return -1;
}

__attribute__((visibility("default")))
BrowserFile *popen(const char *command, const char *mode) {
  (void)command; (void)mode;
  browser_errno = 38;
  return (BrowserFile *)0;
}

__attribute__((visibility("default")))
int pclose(BrowserFile *file) {
  (void)file;
  browser_errno = 10;
  return -1;
}

__attribute__((visibility("default")))
int execve(const char *path, char *const arguments[], char *const environment[]) {
  (void)path; (void)arguments; (void)environment;
  browser_errno = 13;
  return -1;
}

__attribute__((visibility("default")))
int chmod(const char *path, uint32_t mode) {
  (void)path; (void)mode;
  return 0;
}

__attribute__((visibility("default")))
int select(int count, void *read_set, void *write_set, void *error_set, BrowserTimespec *timeout) {
  (void)count; (void)read_set; (void)write_set; (void)error_set; (void)timeout;
  return 0;
}

typedef struct {
  char *name;
  char *password;
  uint32_t user_id;
  uint32_t group_id;
  char *gecos;
  char *directory;
  char *shell;
} BrowserPasswd;

__attribute__((visibility("default")))
BrowserPasswd *getpwnam(const char *name) {
  static char user[] = "u0_a0";
  static char password[] = "x";
  static char directory[] = "/data/user/0/jp.gungho.pad";
  static char shell[] = "/system/bin/sh";
  static BrowserPasswd result = { user, password, 10000, 10000, user, directory, shell };
  (void)name;
  return &result;
}

__attribute__((visibility("default")))
BrowserPasswd *getpwuid(uint32_t user_id) {
  (void)user_id;
  return getpwnam((const char *)0);
}

__attribute__((visibility("default")))
int pthread_mutex_init(uint64_t *mutex, const void *attributes) {
  (void)attributes;
  if (mutex) *mutex = 0;
  return 0;
}

__attribute__((visibility("default")))
int pthread_mutex_lock(void *mutex) {
  (void)mutex;
  return 0;
}

__attribute__((visibility("default")))
int pthread_mutex_unlock(void *mutex) {
  (void)mutex;
  return 0;
}

static void *browser_thread_specific[32];
static uint32_t browser_next_thread_key;

__attribute__((visibility("default")))
int pthread_key_create(uint32_t *key, void (*destructor)(void *)) {
  (void)destructor;
  if (!key || browser_next_thread_key >= 32) return 11;
  *key = browser_next_thread_key++;
  return 0;
}

__attribute__((visibility("default")))
int pthread_setspecific(uint32_t key, const void *value) {
  if (key >= 32) return 22;
  browser_thread_specific[key] = (void *)value;
  return 0;
}

__attribute__((visibility("default")))
void *pthread_getspecific(uint32_t key) {
  return key < 32 ? browser_thread_specific[key] : (void *)0;
}

__attribute__((visibility("default")))
int pthread_once(uint32_t *control, void (*initialize)(void)) {
  if (!control || !initialize) return 22;
  if (!*control) {
    *control = 1;
    initialize();
    *control = 2;
  }
  return 0;
}

__attribute__((visibility("default")))
int pthread_detach(uint64_t thread) {
  (void)thread;
  return 0;
}

typedef struct {
  uint64_t identifier;
  void *result;
  int active;
} BrowserThread;

static BrowserThread browser_threads[32];
static uint64_t browser_next_thread = 1;
__attribute__((visibility("default")))
uint64_t browser_thread_results[32];
__attribute__((visibility("default")))
uint64_t browser_thread_arguments[32];
__attribute__((visibility("default")))
uint64_t browser_thread_starts[32];
__attribute__((visibility("default")))
uint64_t browser_thread_callers[32];
__attribute__((visibility("default")))
uint8_t browser_thread_argument_snapshots[32][48];
__attribute__((visibility("default")))
uint64_t browser_thread_create_count;
__attribute__((visibility("default")))
uint64_t browser_thread_join_count;

__attribute__((visibility("default")))
int pthread_attr_init(void *attributes) {
  if (attributes) *(uint64_t *)attributes = 0;
  return 0;
}

__attribute__((visibility("default")))
int pthread_attr_setdetachstate(void *attributes, int state) {
  if (attributes) *(uint64_t *)attributes = (uint64_t)(uint32_t)state;
  return 0;
}

__attribute__((visibility("default")))
int pthread_attr_destroy(void *attributes) {
  (void)attributes;
  return 0;
}

__attribute__((visibility("default"), noreturn))
void pthread_exit(void *result) {
  browser_syscall3(93, (uint64_t)result, 0, 0);
  for (;;) { }
}

static int browser_direct_pthread_create(uint64_t *thread, const void *attributes, void *(*start)(void *), void *argument) {
  (void)attributes;
  browser_thread_create_count += 1;
  if (!thread || !start) return 22;
  for (uint32_t index = 0; index < sizeof(browser_threads) / sizeof(browser_threads[0]); index++) {
    if (!browser_threads[index].active) {
      uint64_t identifier = browser_next_thread++;
      browser_threads[index].identifier = identifier;
      browser_threads[index].active = 1;
      *thread = identifier;
      browser_thread_arguments[index] = (uint64_t)argument;
      browser_thread_starts[index] = (uint64_t)start;
      browser_thread_callers[index] = (uint64_t)__builtin_return_address(0);
      browser_threads[index].result = start(argument);
      for (uint32_t byte = 0; byte < 48; byte++) browser_thread_argument_snapshots[index][byte] = ((uint8_t *)argument)[byte];
      browser_thread_results[index] = (uint64_t)browser_threads[index].result;
      return 0;
    }
  }
  return 11;
}

static int browser_direct_pthread_join(uint64_t thread, void **result) {
  browser_thread_join_count += 1;
  for (uint32_t index = 0; index < sizeof(browser_threads) / sizeof(browser_threads[0]); index++) {
    if (browser_threads[index].active && browser_threads[index].identifier == thread) {
      if (result) *result = browser_threads[index].result;
      browser_threads[index].active = 0;
      return 0;
    }
  }
  return 3;
}

/*
 * Guest-loaded protector modules resolve these directly from libc's ELF
 * symbol table instead of going through dlsym. Keep concrete exports in the
 * browser libc image; otherwise their JUMP_SLOT remains zero even though the
 * JS dlsym bridge can resolve the same names.
 */
__attribute__((visibility("default")))
__attribute__((naked))
int pthread_create(uint64_t *thread, const void *attributes, void *(*start)(void *), void *argument) {
  __asm__ volatile("brk #0\nret");
}

__attribute__((visibility("default")))
__attribute__((naked))
int pthread_join(uint64_t thread, void **result) {
  __asm__ volatile("brk #0\nret");
}
#endif
