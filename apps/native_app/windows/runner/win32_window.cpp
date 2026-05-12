#include "win32_window.h"

Win32Window::Win32Window() : window_handle_(nullptr) {}
Win32Window::~Win32Window() {}

bool Win32Window::Create(const std::wstring& title, const Point& origin,
                         const Size& size) {
  WNDCLASS window_class = {};
  window_class.hCursor = LoadCursor(nullptr, IDC_ARROW);
  window_class.lpszClassName = L"FLUTTER_RUNNER_WIN32_WINDOW";
  window_class.style = CS_HREDRAW | CS_VREDRAW;
  window_class.cbClsExtra = 0;
  window_class.cbWndExtra = 0;
  window_class.hInstance = GetModuleHandle(nullptr);
  window_class.hIcon = nullptr;
  window_class.hbrBackground = 0;
  window_class.lpszMenuName = nullptr;
  window_class.lpfnWndProc = Win32Window::WndProc;
  RegisterClass(&window_class);

  HWND window = CreateWindow(window_class.lpszClassName, title.c_str(),
                             WS_OVERLAPPEDWINDOW | WS_VISIBLE, origin.x,
                             origin.y, size.width, size.height, nullptr,
                             nullptr, GetModuleHandle(nullptr), this);

  if (!window) {
    return false;
  }

  return OnCreate();
}

bool Win32Window::OnCreate() { return true; }
void Win32Window::OnDestroy() {}

LRESULT Win32Window::MessageHandler(HWND hwnd, UINT const message,
                                    WPARAM const wparam,
                                    LPARAM const lparam) noexcept {
  switch (message) {
    case WM_DESTROY:
      OnDestroy();
      if (quit_on_close_) PostQuitMessage(0);
      return 0;
  }

  return DefWindowProc(hwnd, message, wparam, lparam);
}

LRESULT CALLBACK Win32Window::WndProc(HWND const window, UINT const message,
                                      WPARAM const wparam,
                                      LPARAM const lparam) noexcept {
  if (message == WM_NCCREATE) {
    auto window_struct = reinterpret_cast<CREATESTRUCT*>(lparam);
    SetWindowLongPtr(window, GWLP_USERDATA,
                     reinterpret_cast<LONG_PTR>(window_struct->lpCreateParams));

    auto that = static_cast<Win32Window*>(window_struct->lpCreateParams);
    that->window_handle_ = window;
  }

  auto that = reinterpret_cast<Win32Window*>(GetWindowLongPtr(window, GWLP_USERDATA));
  return that ? that->MessageHandler(window, message, wparam, lparam)
              : DefWindowProc(window, message, wparam, lparam);
}

bool Win32Window::Show() { return ShowWindow(window_handle_, SW_SHOWNORMAL); }
void Win32Window::Close() { DestroyWindow(window_handle_); }
HWND Win32Window::GetHandle() { return window_handle_; }
void Win32Window::SetQuitOnClose(bool quit_on_close) { quit_on_close_ = quit_on_close; }
RECT Win32Window::GetClientArea() {
  RECT frame;
  GetClientRect(window_handle_, &frame);
  return frame;
}
void Win32Window::SetChildContent(HWND content) {
  SetParent(content, window_handle_);
  RECT frame = GetClientArea();
  MoveWindow(content, frame.left, frame.top, frame.right - frame.left,
             frame.bottom - frame.top, true);
  ShowWindow(content, SW_SHOW);
}
