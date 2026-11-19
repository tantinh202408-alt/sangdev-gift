/**
 * DearGift Effects — thư viện hiệu ứng dùng chung cho các mẫu quà.
 * Không phụ thuộc thư viện ngoài, chạy được trên mọi hosting.
 */
window.GiftFX = (function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * Lớp phủ để thả hạt vào.
     *
     * Không truyền `parent` thì phủ kín màn hình (dùng cho trang xem quà).
     * Truyền `parent` thì bám vào đúng phần tử đó — hạt rơi trong khuôn khổ khối
     * ấy thôi, cuộn qua là hết, không đè lên nội dung phía dưới.
     */
    function layer(zIndex, parent) {
        var el = document.createElement('div');
        el.style.cssText = 'inset:0;pointer-events:none;overflow:hidden;z-index:' + (zIndex || 3) + ';'
            + (parent ? 'position:absolute;' : 'position:fixed;');

        if (parent) {
            // Cần một mốc định vị, nếu không lớp phủ sẽ nhảy ra ngoài khối cha
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }
            parent.appendChild(el);
        } else {
            document.body.appendChild(el);
        }
        return el;
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    /* ---------- Vật thể rơi: tim, tuyết, hoa, sao ---------- */
    /**
     * @param opts.container  Phần tử để rơi bên trong (mặc định: cả màn hình)
     * @param opts.opacity    Độ đậm tối đa của hạt, 0–1 (mặc định 1)
     */
    function falling(opts) {
        opts = opts || {};
        var chars = opts.chars || ['❤️'];
        var count = opts.count || 26;
        var box = layer(opts.z || 3, opts.container);
        if (reduceMotion) count = Math.min(count, 8);

        // Rơi trong một khối thì đo bằng % chiều cao khối đó; phủ màn hình thì đo bằng vh.
        var unit = opts.container ? '%' : 'vh';
        var peak = (opts.opacity == null ? 1 : opts.opacity);

        var name = 'gfx-fall-' + (opts.container ? 'box' : 'win');
        var style = document.createElement('style');
        style.textContent =
            '@keyframes ' + name + '{0%{transform:translateY(-12' + unit + ') rotate(0);opacity:0}' +
            '10%{opacity:' + peak + '}90%{opacity:' + peak + '}' +
            '100%{transform:translateY(112' + unit + ') rotate(360deg);opacity:0}}';
        box.appendChild(style);

        for (var i = 0; i < count; i++) {
            var s = document.createElement('span');
            s.textContent = chars[Math.floor(Math.random() * chars.length)];
            s.style.cssText =
                'position:absolute;top:0;left:' + rand(0, 100).toFixed(2) + '%;' +
                'font-size:' + rand(opts.min || 14, opts.max || 30).toFixed(0) + 'px;' +
                'animation:' + name + ' ' + rand(6, 14).toFixed(1) + 's linear ' + rand(0, 8).toFixed(1) + 's infinite;' +
                'will-change:transform;opacity:0';
            box.appendChild(s);
        }
        return box;
    }

    var hearts = function (n) { return falling({ chars: ['❤️', '💕', '💖', '💗'], count: n || 24 }); };
    var snow = function (n) { return falling({ chars: ['❄️', '❅', '•'], count: n || 40, min: 10, max: 24 }); };
    var petals = function (n) { return falling({ chars: ['🌸', '🌺', '🍃'], count: n || 22 }); };
    var stars = function (n) { return falling({ chars: ['✨', '⭐', '💫'], count: n || 20 }); };

    /* ==================================================================
       Lớp nền trang trí: mưa sao băng, cánh hoa rơi, đốm sáng lấp lánh.
       Khác nhóm falling() ở trên — nhóm này vẽ bằng CSS thuần chứ không
       dùng emoji, nên ăn theo bảng màu của giao diện và nét hơn khi phóng to.
       ================================================================== */

    // Mỗi bộ khung hình chỉ nhồi vào <head> một lần, dù gọi hiệu ứng bao nhiêu lượt.
    function ensureStyle(id, css) {
        if (document.getElementById(id)) return;
        var s = document.createElement('style');
        s.id = id;
        s.textContent = css;
        document.head.appendChild(s);
    }

    var BASE_CSS =
        '.gfx-paused *{animation-play-state:paused!important}';

    /**
     * Tạm dừng hiệu ứng khi khối trôi khỏi màn hình hoặc khi người dùng
     * chuyển sang tab khác. Hoạt ảnh CSS vẫn ngốn CPU dù không ai nhìn,
     * nên đây là phần đáng giá nhất về hiệu năng.
     */
    function autoPause(box, target) {
        var onScreen = true;
        var tabShown = !document.hidden;

        function apply() {
            box.classList.toggle('gfx-paused', !(onScreen && tabShown));
        }

        if (window.IntersectionObserver) {
            new IntersectionObserver(function (entries) {
                onScreen = entries[0].isIntersecting;
                apply();
            }, { rootMargin: '80px' }).observe(target);
        }
        document.addEventListener('visibilitychange', function () {
            tabShown = !document.hidden;
            apply();
        });
        apply();
    }

    // Đo khối chứa để quy đổi quãng đường rơi/bay ra pixel.
    // Giữ trên chính lớp phủ để các hạt con thừa kế, đổi kích thước chỉ cần ghi lại một chỗ.
    function sizeVar(box, host, name, factor) {
        function set() {
            var w = host.clientWidth || window.innerWidth;
            var h = host.clientHeight || window.innerHeight;
            box.style.setProperty(name, Math.round(factor(w, h)) + 'px');
        }
        set();
        var t;
        window.addEventListener('resize', function () {
            clearTimeout(t);
            t = setTimeout(set, 200);
        });
    }

    var METEOR_CSS = BASE_CSS +
        '.gfx-meteor{position:absolute;top:var(--y);left:var(--x);height:2px;width:var(--len);' +
        'border-radius:99px;background:linear-gradient(90deg,transparent,var(--c));' +
        'transform-origin:100% 50%;opacity:0;will-change:transform,opacity;' +
        'animation:gfx-meteor var(--dur) linear var(--delay) infinite}' +
        '.gfx-meteor::after{content:"";position:absolute;right:0;top:50%;width:4px;height:4px;' +
        'margin:-2px -1px 0 0;border-radius:50%;background:#fff;box-shadow:0 0 9px 2px var(--c)}' +
        '@keyframes gfx-meteor{0%{opacity:0;transform:rotate(var(--ang)) translate3d(0,0,0)}' +
        '7%{opacity:1}62%{opacity:1}' +
        '100%{opacity:0;transform:rotate(var(--ang)) translate3d(var(--dist),0,0)}}';

    /**
     * Mưa sao băng — vệt sáng chéo từ trên trái xuống dưới phải.
     * Hợp nhất với nền tối; trên nền sáng nên giảm count và đổi màu đậm hơn.
     *
     * @param opts.container Khối để bay bên trong (mặc định: cả màn hình)
     * @param opts.count     Số vệt (mặc định 14)
     * @param opts.angle     Độ nghiêng, độ (mặc định 22)
     * @param opts.colors    Mảng màu vệt sáng
     */
    function meteors(opts) {
        opts = opts || {};
        ensureStyle('gfx-meteor-css', METEOR_CSS);

        var box = layer(opts.z || 1, opts.container);
        var host = opts.container || document.documentElement;
        var count = opts.count || 14;
        if (reduceMotion) count = Math.min(count, 4);

        var colors = opts.colors || ['#ffd9e6', '#ffffff', '#e3d4fd'];
        var angle = (opts.angle == null ? 22 : opts.angle);

        // Quãng bay lấy theo đường chéo khối chứa để vệt luôn ra khỏi khung
        sizeVar(box, host, '--dist', function (w, h) { return (w + h) * 0.9; });

        for (var i = 0; i < count; i++) {
            var m = document.createElement('i');
            m.className = 'gfx-meteor';
            m.style.cssText =
                '--y:' + rand(-12, 62).toFixed(1) + '%;' +
                '--x:' + rand(-25, 75).toFixed(1) + '%;' +
                '--len:' + rand(60, 170).toFixed(0) + 'px;' +
                '--ang:' + (angle + rand(-4, 4)).toFixed(1) + 'deg;' +
                '--c:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
                '--dur:' + rand(2.4, 5.6).toFixed(2) + 's;' +
                '--delay:' + rand(0, 7).toFixed(2) + 's;';
            box.appendChild(m);
        }
        autoPause(box, host === document.documentElement ? document.body : host);
        return box;
    }

    var PETAL_CSS = BASE_CSS +
        '.gfx-petal{position:absolute;top:0;left:var(--x);opacity:0;will-change:transform,opacity;' +
        'animation:gfx-petal-fall var(--dur) linear var(--delay) infinite}' +
        '.gfx-petal>i{display:block;width:var(--w);height:calc(var(--w)*.74);' +
        'background:linear-gradient(140deg,var(--c1),var(--c2));border-radius:100% 0 100% 0;' +
        'will-change:transform;animation:gfx-petal-spin var(--spin) linear var(--delay) infinite}' +
        '@keyframes gfx-petal-fall{' +
        '0%{opacity:0;transform:translate3d(0,-40px,0)}' +
        '8%{opacity:var(--op)}' +
        '25%{transform:translate3d(var(--sway),calc(var(--fall)*.25),0)}' +
        '50%{transform:translate3d(calc(var(--sway)*-1),calc(var(--fall)*.5),0)}' +
        '75%{transform:translate3d(var(--sway),calc(var(--fall)*.75),0)}' +
        '90%{opacity:var(--op)}' +
        '100%{opacity:0;transform:translate3d(0,var(--fall),0)}}' +
        '@keyframes gfx-petal-spin{0%{transform:rotate3d(1,1,.25,0deg)}' +
        '100%{transform:rotate3d(1,1,.25,360deg)}}';

    /**
     * Cánh hoa rơi — vẽ bằng border-radius chứ không dùng emoji, nên
     * lật xoay trong không gian 3D được và ăn theo màu thương hiệu.
     *
     * Hai lớp lồng nhau vì một phần tử chỉ nhận được một transform:
     * lớp ngoài lo rơi + đưa võng, lớp trong lo lật xoay.
     */
    function petalRain(opts) {
        opts = opts || {};
        ensureStyle('gfx-petal-css', PETAL_CSS);

        var box = layer(opts.z || 1, opts.container);
        var host = opts.container || document.documentElement;
        var count = opts.count || 18;
        if (reduceMotion) count = Math.min(count, 6);

        var pairs = opts.colors || [
            ['#ffd9e6', '#f2708f'],
            ['#f7d9ff', '#b06ae4'],
            ['#ffe9f0', '#ef5f86'],
            ['#e6dcff', '#7c4ddb']
        ];
        var peak = (opts.opacity == null ? 0.85 : opts.opacity);

        sizeVar(box, host, '--fall', function (w, h) { return h + 80; });

        for (var i = 0; i < count; i++) {
            var outer = document.createElement('i');
            outer.className = 'gfx-petal';
            var pair = pairs[Math.floor(Math.random() * pairs.length)];
            outer.style.cssText =
                '--x:' + rand(-2, 100).toFixed(2) + '%;' +
                '--w:' + rand(opts.min || 9, opts.max || 20).toFixed(0) + 'px;' +
                '--sway:' + rand(-46, 46).toFixed(0) + 'px;' +
                '--dur:' + rand(9, 19).toFixed(1) + 's;' +
                '--spin:' + rand(3, 8).toFixed(1) + 's;' +
                '--delay:' + rand(0, 12).toFixed(1) + 's;' +
                '--op:' + peak + ';' +
                '--c1:' + pair[0] + ';--c2:' + pair[1] + ';';
            outer.appendChild(document.createElement('i'));
            box.appendChild(outer);
        }
        autoPause(box, host === document.documentElement ? document.body : host);
        return box;
    }

    var SPARK_CSS = BASE_CSS +
        '.gfx-spark{position:absolute;top:var(--y);left:var(--x);width:var(--w);height:var(--w);' +
        'border-radius:50%;opacity:0;will-change:transform,opacity;' +
        'background:radial-gradient(circle,#fff 0%,var(--c) 45%,transparent 72%);' +
        'animation:gfx-spark var(--dur) ease-in-out var(--delay) infinite}' +
        '@keyframes gfx-spark{0%,100%{opacity:0;transform:scale(.35)}' +
        '50%{opacity:var(--op);transform:scale(1)}}';

    /** Đốm sáng lấp lánh — nhẹ nhất trong ba loại, hợp cho dải CTA. */
    function sparkles(opts) {
        opts = opts || {};
        ensureStyle('gfx-spark-css', SPARK_CSS);

        var box = layer(opts.z || 1, opts.container);
        var host = opts.container || document.documentElement;
        var count = opts.count || 22;
        if (reduceMotion) count = Math.min(count, 8);

        var colors = opts.colors || ['#ffd9e6', '#e3d4fd', '#ffffff'];
        var peak = (opts.opacity == null ? 0.9 : opts.opacity);

        for (var i = 0; i < count; i++) {
            var s = document.createElement('i');
            s.className = 'gfx-spark';
            s.style.cssText =
                '--x:' + rand(0, 100).toFixed(2) + '%;' +
                '--y:' + rand(0, 100).toFixed(2) + '%;' +
                '--w:' + rand(opts.min || 4, opts.max || 12).toFixed(0) + 'px;' +
                '--c:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
                '--dur:' + rand(2.2, 5).toFixed(2) + 's;' +
                '--delay:' + rand(0, 5).toFixed(2) + 's;' +
                '--op:' + peak + ';';
            box.appendChild(s);
        }
        autoPause(box, host === document.documentElement ? document.body : host);
        return box;
    }

    /* ---------- Khai báo hiệu ứng ngay trong HTML ----------
       <section data-fx="petals" data-fx-count="16" data-fx-opacity=".7">
       Nhờ vậy thêm hiệu ứng cho trang mới chỉ là gắn thuộc tính, không phải
       viết thêm script ở cuối mỗi trang. */
    // Gộp tuỳ chọn — viết tay thay cho Object.assign để đồng bộ với phong cách
    // ES5 của cả file và chạy được trên trình duyệt cũ.
    function withChars(chars, o) {
        var out = { chars: chars };
        for (var k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k]; }
        return out;
    }

    var KINDS = {
        meteors: meteors,
        petals: petalRain,
        sparkles: sparkles,
        hearts: function (o) { return falling(withChars(['❤️', '💕', '💖', '💝'], o)); },
        snow: function (o) { return falling(withChars(['❄️', '❅', '•'], o)); }
    };

    function auto(root) {
        var nodes = (root || document).querySelectorAll('[data-fx]');
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            if (el.getAttribute('data-fx-ready')) continue;   // tránh khởi tạo lại
            var fn = KINDS[el.getAttribute('data-fx')];
            if (!fn) continue;

            // Gắn trên <body> nghĩa là phủ cả màn hình: bỏ container để layer()
            // dùng position:fixed, hạt rơi theo khung nhìn thay vì theo chiều
            // cao toàn trang (trang dài thì rơi chậm như đứng yên).
            var opts = (el === document.body) ? {} : { container: el };
            ['count', 'min', 'max', 'z', 'opacity', 'angle'].forEach(function (k) {
                var v = el.getAttribute('data-fx-' + k);
                if (v !== null && v !== '') opts[k] = parseFloat(v);
            });

            el.setAttribute('data-fx-ready', '1');
            fn(opts);
        }
    }

    /* ---------- Pháo hoa trên canvas ---------- */
    function fireworks(opts) {
        opts = opts || {};
        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:' + (opts.z || 2);
        document.body.appendChild(canvas);

        var ctx = canvas.getContext('2d');
        var particles = [];
        var colors = opts.colors || ['#ff5f8f', '#7c5cff', '#ffd166', '#4ecdc4', '#ffffff', '#ff9f1c'];
        var running = true;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        function burst(x, y) {
            var color = colors[Math.floor(Math.random() * colors.length)];
            var n = reduceMotion ? 22 : 46;
            for (var i = 0; i < n; i++) {
                var angle = (Math.PI * 2 * i) / n;
                var speed = rand(1.6, 5.2);
                particles.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    decay: rand(0.008, 0.020),
                    color: color,
                    size: rand(1.4, 3.2)
                });
            }
        }

        function loop() {
            if (!running) return;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0,0,0,0.14)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'lighter';

            for (var i = particles.length - 1; i >= 0; i--) {
                var p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.045;
                p.vx *= 0.99;
                p.life -= p.decay;
                if (p.life <= 0) { particles.splice(i, 1); continue; }
                ctx.globalAlpha = Math.max(p.life, 0);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(loop);
        }
        loop();

        var timer = setInterval(function () {
            burst(rand(canvas.width * 0.12, canvas.width * 0.88), rand(canvas.height * 0.08, canvas.height * 0.55));
        }, opts.interval || 850);

        // Bắn vài quả ngay lập tức cho vui mắt
        burst(canvas.width * 0.3, canvas.height * 0.3);
        setTimeout(function () { burst(canvas.width * 0.7, canvas.height * 0.35); }, 400);

        return {
            burst: burst,
            stop: function () {
                running = false;
                clearInterval(timer);
                canvas.remove();
            }
        };
    }

    /* ---------- Confetti bắn 1 lần ---------- */
    function confetti(opts) {
        opts = opts || {};
        var box = layer(opts.z || 5);
        var colors = ['#ff5f8f', '#7c5cff', '#ffd166', '#4ecdc4', '#ff9f1c', '#06d6a0'];
        var count = reduceMotion ? 40 : (opts.count || 120);

        var style = document.createElement('style');
        style.textContent =
            '@keyframes gfx-confetti{0%{transform:translate3d(0,0,0) rotate(0);opacity:1}' +
            '100%{transform:translate3d(var(--dx),105vh,0) rotate(var(--rot));opacity:0}}';
        box.appendChild(style);

        for (var i = 0; i < count; i++) {
            var p = document.createElement('i');
            var w = rand(6, 11);
            p.style.cssText =
                'position:absolute;top:' + rand(-15, 8) + 'vh;left:' + rand(0, 100) + '%;' +
                'width:' + w + 'px;height:' + (w * rand(0.4, 1.4)) + 'px;' +
                'background:' + colors[i % colors.length] + ';' +
                'border-radius:' + (Math.random() > 0.6 ? '50%' : '2px') + ';' +
                '--dx:' + rand(-140, 140).toFixed(0) + 'px;--rot:' + rand(360, 1200).toFixed(0) + 'deg;' +
                'animation:gfx-confetti ' + rand(2.6, 5.2).toFixed(1) + 's ease-in ' + rand(0, 1.2).toFixed(1) + 's forwards;';
            box.appendChild(p);
        }
        setTimeout(function () { box.remove(); }, (opts.life || 7000));
        return box;
    }

    /* ---------- Gõ chữ ---------- */
    function typewriter(el, text, speed, done) {
        if (!el) return;
        el.textContent = '';
        if (reduceMotion) { el.textContent = text; if (done) done(); return; }
        var i = 0;
        (function tick() {
            if (i >= text.length) { if (done) done(); return; }
            el.textContent += text.charAt(i++);
            setTimeout(tick, text.charAt(i - 1) === '\n' ? (speed || 55) * 4 : (speed || 55));
        })();
    }

    /* ---------- Đếm thời gian bên nhau ---------- */
    function countUp(el, fromDate) {
        if (!el || !fromDate) return;
        var start = new Date(fromDate).getTime();
        if (isNaN(start)) return;

        function tick() {
            var diff = Math.max(0, Date.now() - start);
            el.innerHTML = counterHtml(
                Math.floor(diff / 86400000),
                Math.floor(diff / 3600000) % 24,
                Math.floor(diff / 60000) % 60,
                Math.floor(diff / 1000) % 60
            );
        }
        tick();
        setInterval(tick, 1000);
    }

    /* ---------- Khung số của đồng hồ (mỗi ô là một cặp số + nhãn) ---------- */
    function counterHtml(days, hours, minutes, seconds) {
        function pad(n) { return n < 10 ? '0' + n : n; }
        return '<span><b>' + days + '</b><small>ngày</small></span>' +
               '<span><b>' + pad(hours) + '</b><small>giờ</small></span>' +
               '<span><b>' + pad(minutes) + '</b><small>phút</small></span>' +
               '<span><b>' + pad(seconds) + '</b><small>giây</small></span>';
    }

    /* ---------- Đếm ngược tới một mốc ---------- */
    function countDown(el, toDate, onDone) {
        if (!el || !toDate) return;
        var end = new Date(toDate).getTime();
        if (isNaN(end)) return;
        var timer = setInterval(function tick() {
            var diff = end - Date.now();
            if (diff <= 0) {
                clearInterval(timer);
                el.innerHTML = counterHtml(0, 0, 0, 0);
                if (onDone) onDone();
                return;
            }
            el.innerHTML = counterHtml(
                Math.floor(diff / 86400000),
                Math.floor(diff / 3600000) % 24,
                Math.floor(diff / 60000) % 60,
                Math.floor(diff / 1000) % 60
            );
        }, 250);
    }

    // Quét [data-fx] ngay khi DOM sẵn sàng. Trang nào không gắn thuộc tính
    // thì vòng quét chạy rỗng, không tốn gì.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { auto(); });
    } else {
        auto();
    }

    return {
        falling: falling,
        hearts: hearts,
        snow: snow,
        petals: petals,
        stars: stars,
        meteors: meteors,
        petalRain: petalRain,
        sparkles: sparkles,
        auto: auto,
        fireworks: fireworks,
        confetti: confetti,
        typewriter: typewriter,
        countUp: countUp,
        countDown: countDown,
        reduceMotion: reduceMotion
    };
})();
