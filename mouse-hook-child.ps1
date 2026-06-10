$code = @'
using System;
using System.Runtime.InteropServices;

public class MouseHook
{
    private delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);
    private static LowLevelMouseProc _proc = Callback;
    private static IntPtr _hookId = IntPtr.Zero;

    public static void Start() {
        _hookId = SetHook(_proc);
        MSG msg;
        while (GetMessage(out msg, IntPtr.Zero, 0, 0) != 0) {
            TranslateMessage(ref msg);
            DispatchMessage(ref msg);
        }
        UnhookWindowsHookEx(_hookId);
    }

    private static IntPtr SetHook(LowLevelMouseProc proc) {
        using (var curProcess = System.Diagnostics.Process.GetCurrentProcess())
        using (var curModule = curProcess.MainModule) {
            return SetWindowsHookEx(14, proc, GetModuleHandle(curModule.ModuleName), 0);
        }
    }

    private static IntPtr Callback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0) {
            int msg = (int)wParam;
            switch (msg) {
                case 0x0201: Output("mousedown", 1); break;
                case 0x0202: Output("mouseup", 1); break;
                case 0x0204: Output("mousedown", 2); break;
                case 0x0205: Output("mouseup", 2); break;
                case 0x0207: Output("mousedown", 3); break;
                case 0x0208: Output("mouseup", 3); break;
                case 0x020B: {
                    int xb = (Marshal.ReadInt32(lParam, 8) >> 16) & 0xFFFF;
                    if (xb == 1) Output("mousedown", 4);
                    else if (xb == 2) Output("mousedown", 5);
                    break;
                }
                case 0x020C: {
                    int xb = (Marshal.ReadInt32(lParam, 8) >> 16) & 0xFFFF;
                    if (xb == 1) Output("mouseup", 4);
                    else if (xb == 2) Output("mouseup", 5);
                    break;
                }
            }
        }
        return CallNextHookEx(_hookId, nCode, wParam, lParam);
    }

    private static void Output(string type, int button) {
        Console.WriteLine("{\"type\":\"" + type + "\",\"button\":" + button + "}");
        Console.Out.Flush();
    }

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    [DllImport("user32.dll")]
    private static extern int GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

    [DllImport("user32.dll")]
    private static extern bool TranslateMessage(ref MSG lpMsg);

    [DllImport("user32.dll")]
    private static extern IntPtr DispatchMessage(ref MSG lpMsg);

    [StructLayout(LayoutKind.Sequential)]
    private struct MSG {
        public IntPtr hwnd;
        public uint message;
        public IntPtr wParam;
        public IntPtr lParam;
        public uint time;
        public int pt_x;
        public int pt_y;
    }
}
'@

Add-Type -TypeDefinition $code
[MouseHook]::Start()
