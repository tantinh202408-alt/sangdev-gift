/**
 * 🛡️ DearGift Security Shield (Client-Side Protection)
 * - Bản quyền thiết kế & phát triển thuộc về BÙI MINH QUYẾT
 * - Hotline / Zalo: 0328.489.573
 * - Tự động phát hiện F12 / DevTools mở trước và đá thẳng về Google (Chống soi mã nguồn)
 * - Tối ưu nhận diện thông minh, an toàn 100% không làm ảnh hưởng điện thoại thật
 * - Chống F12, DevTools, Inspect Element, Ctrl+U, Ctrl+S, Chuột phải
 */
(function () {
    'use strict';

    // Luôn hiển thị nhận diện bản quyền, kể cả khi chạy localhost để kiểm tra.
    // Đặt trước nhánh debug để không bị bỏ qua bởi lệnh return bên dưới.
    function showCopyrightNotice() {
        if (typeof console === 'undefined') return;

        const signStyle = 'color: #fff; background: linear-gradient(135deg, #d6236f, #e91e63); padding: 8px 18px; border-radius: 6px; font-weight: 800; font-size: 13px; letter-spacing: 1px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);';
        const contactStyle = 'color: #d6236f; border: 1px solid #d6236f; padding: 4px 14px; border-radius: 4px; font-weight: 600; font-size: 12px; margin-top: 4px;';
        const warnTitle = 'color: #ef4444; font-size: 26px; font-weight: 900;';
        const warnBody = 'color: #334155; font-size: 13px; font-weight: 600; line-height: 1.6;';
        const warnDanger = 'color: #b91c1c; font-size: 13px; font-weight: 800; background: #fee2e2; padding: 4px 8px; border-radius: 4px;';

        setTimeout(function () {
            try {
                console.log(
                    "\n%c DEARGIFT® — DESIGNED & DEVELOPED BY BÙI MINH QUYẾT %c\n\n%c Zalo: 0328.489.573 · Bản quyền thuộc về Bùi Minh Quyết %c\n",
                    signStyle,
                    '',
                    contactStyle,
                    ''
                );
                console.log('%c🛑 DỪNG LẠI (STOP)!', warnTitle);
                console.log('%cĐây là tính năng trình duyệt dành riêng cho lập trình viên.', warnBody);
                console.log('%cKHÔNG ĐƯỢC sao chép hoặc dán mã lạ vào đây để tránh bị đánh cắp tài khoản!', warnDanger);
            } catch (e) {}
        }, 250);
    }

    showCopyrightNotice();

    // Môi trường localhost dùng để kiểm tra và sửa lỗi: không chặn
    // DevTools/F12, chuột phải hay chuyển hướng sang Google. Bảo vệ
    // vẫn hoạt động trên tên miền thật.
    const debugHosts = ['localhost', '127.0.0.1', '::1'];
    if (debugHosts.includes(window.location.hostname)) {
        console.info('[DearGift] Chế độ kiểm tra localhost: DevTools đã được cho phép.');
        return;
    }

    // Trang đang nằm trong iframe (khung xem trước của builder, cửa sổ "Xem demo"):
    // không bật cơ chế đá sang Google. Google cấm nhúng iframe nên nếu chuyển hướng,
    // khung xem trước sẽ hiện "Nội dung này bị chặn" (ví dụ khi người dùng đang mở F12
    // ở trang builder). Trang cha đã tự quyết định có bật bảo vệ hay không.
    let isFramed = true;
    try { isFramed = window.self !== window.top; } catch (e) { isFramed = true; }
    if (isFramed) return;

    let isRedirecting = false;

    // 1. Hàm nhận diện thiết bị điện thoại thật (Tránh nhận diện nhầm)
    function isRealMobileDevice() {
        try {
            const ua = navigator.userAgent || navigator.vendor || window.opera || '';
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);
            const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
            const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            
            return isMobileUA && (hasTouch || isCoarse);
        } catch (e) {
            return false;
        }
    }

    // 2. Hàm đá thẳng về trang chủ Google khi phát hiện DevTools
    function banToGoogle() {
        if (isRedirecting) return;
        isRedirecting = true;
        
        try {
            if (document.body) document.body.innerHTML = '';
            if (document.head) document.head.innerHTML = '';
            document.documentElement.innerHTML = '';
        } catch (e) {}
        
        window.location.replace('https://www.google.com');
    }

    // 3. Cơ chế 1: Bẫy thời gian Debugger (Phát hiện F12 mở trước hoặc mở sau)
    function checkDebuggerTiming() {
        const start = performance.now();
        // Khi DevTools đang mở, lệnh debugger sẽ làm trễ luồng thực thi > 100ms
        debugger;
        const duration = performance.now() - start;
        if (duration > 100) {
            banToGoogle();
        }
    }

    // 4. Cơ chế 2: Bẫy Getter Console (Chỉ kích hoạt khi DevTools Console đang mở)
    function setupConsoleTrap() {
        try {
            const trap = new Image();
            Object.defineProperty(trap, 'id', {
                get: function () {
                    banToGoogle();
                    return 'shield';
                }
            });
            console.log('%c', trap);
            if (console.clear) console.clear();
        } catch (e) {}
    }

    // 5. Cơ chế 3: Kiểm tra độ lệch kích thước cửa sổ (Chỉ áp dụng trên Desktop, không áp dụng cho điện thoại thật)
    function checkWindowDimension() {
        if (isRealMobileDevice()) return; // Tuyệt đối bỏ qua kiểm tra kích thước trên điện thoại thật
        // Trang nằm trong iframe (khung xem trước builder, cửa sổ "Xem demo"): outerWidth là của
        // cả trình duyệt nên luôn lệch lớn → không được coi là mở DevTools.
        try { if (window.self !== window.top) return; } catch (e) { return; }

        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;
        
        if (widthDiff || heightDiff) {
            banToGoogle();
        }
    }

    // Khởi chạy kiểm tra ngay khi nạp trang
    checkDebuggerTiming();
    setupConsoleTrap();
    checkWindowDimension();

    // Lặp lại kiểm tra định kỳ mỗi 1.2 giây để bắt các trường hợp mở F12 sau đó
    setInterval(function () {
        checkDebuggerTiming();
        checkWindowDimension();
    }, 1200);

    // 6. Chặn chuột phải (Context Menu) - Vẫn cho phép trên các ô nhập dữ liệu
    document.addEventListener('contextmenu', function (e) {
        const target = e.target;
        const isInput = target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        );
        if (!isInput) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, { capture: true, passive: false });

    // 8. Chặn các phím tắt DevTools, Xem nguồn & Lưu trang
    document.addEventListener('keydown', function (e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            banToGoogle();
            return false;
        }

        const isCtrl = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;
        const key = (e.key || '').toUpperCase();
        const code = e.keyCode;

        // Ctrl + Shift + I / J / C / K
        if (isCtrl && isShift && (key === 'I' || key === 'J' || key === 'C' || key === 'K' || code === 73 || code === 74 || code === 67 || code === 75)) {
            e.preventDefault();
            e.stopPropagation();
            banToGoogle();
            return false;
        }

        // Ctrl + U (Xem mã nguồn)
        if (isCtrl && (key === 'U' || code === 85)) {
            e.preventDefault();
            e.stopPropagation();
            banToGoogle();
            return false;
        }

        // Ctrl + S (Lưu trang web)
        if (isCtrl && (key === 'S' || code === 83)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, { capture: true, passive: false });

    // 9. Chống kéo thả ảnh
    document.addEventListener('dragstart', function (e) {
        const target = e.target;
        if (target && target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    }, false);

})();
