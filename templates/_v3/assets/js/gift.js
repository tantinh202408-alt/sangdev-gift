/**
 * Điều khiển chung của trang xem quà: màn hình mở quà + nhạc nền.
 * Các mẫu lắng nghe sự kiện 'gift:open' để bắt đầu hiệu ứng của mình.
 */
(function () {
    'use strict';

    var opener = document.getElementById('giftOpener');
    var opened = false;

    function openGift() {
        if (opened) return;
        opened = true;
        if (opener) opener.classList.add('is-hidden');
        Music.play();
        document.dispatchEvent(new CustomEvent('gift:open'));
        setTimeout(function () { if (opener) opener.style.display = 'none'; }, 700);
    }

    window.giftOpen = openGift;
    window.giftIsOpen = function () { return opened; };

    if (opener) {
        opener.addEventListener('click', openGift);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') openGift();
        });
    } else {
        // Không có màn hình mở quà -> chạy hiệu ứng ngay
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', openGift);
        } else {
            setTimeout(openGift, 30);
        }
    }

    /* ---------------- Nhạc nền ---------------- */
    var Music = (function () {
        var cfg = window.GIFT_MUSIC || null;
        var btn = document.getElementById('giftMusicBtn');
        var audio = document.getElementById('giftAudio');
        var ytPlayer = null;
        var ytReady = false;
        var wantPlay = false;
        var playing = false;

        function mark(state) {
            playing = state;
            if (btn) btn.classList.toggle('is-playing', state);
        }

        function loadYouTube() {
            if (window.YT && window.YT.Player) { createYT(); return; }
            var tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
            window.onYouTubeIframeAPIReady = createYT;
        }

        function createYT() {
            ytPlayer = new window.YT.Player('ytHost', {
                height: '1', width: '1', videoId: cfg.id,
                playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: cfg.id, playsinline: 1 },
                events: {
                    onReady: function () {
                        ytReady = true;
                        if (wantPlay) { ytPlayer.playVideo(); mark(true); }
                    },
                    onStateChange: function (e) {
                        if (e.data === window.YT.PlayerState.ENDED) ytPlayer.playVideo();
                    }
                }
            });
        }

        // Nhạc khách tự tải lên chỉ được nghe 30 giây: quay về đầu thay vì dừng hẳn,
        // thẻ <audio> đã có loop nên thành một vòng lặp 30 giây liền mạch.
        if (audio && cfg && cfg.maxSeconds > 0) {
            audio.addEventListener('timeupdate', function () {
                if (audio.currentTime >= cfg.maxSeconds) audio.currentTime = 0;
            });
        }

        function play() {
            if (!cfg) return;
            wantPlay = true;
            if (cfg.type === 'audio' && audio) {
                var p = audio.play();
                if (p && p.catch) p.then(function () { mark(true); }).catch(function () { mark(false); });
                else mark(true);
            } else if (cfg.type === 'youtube') {
                if (ytReady && ytPlayer) { ytPlayer.playVideo(); mark(true); }
            }
        }

        function pause() {
            wantPlay = false;
            if (cfg && cfg.type === 'audio' && audio) audio.pause();
            if (ytReady && ytPlayer) ytPlayer.pauseVideo();
            mark(false);
        }

        if (cfg) {
            if (cfg.type === 'youtube') loadYouTube();
            if (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    playing ? pause() : play();
                });
            }
            // Trình duyệt chặn autoplay nhạc có tiếng cho tới khi người dùng chạm/bấm.
            // Ở lần tương tác thật đầu tiên, luôn thử phát lại — kể cả khi YouTube đã
            // "tưởng" là đang phát (onReady gọi playVideo lúc chưa có cử chỉ nên bị chặn
            // câm). Với mẫu tự mở (self_opener), chính cú chạm mở quà là cử chỉ này.
            ['click', 'touchstart', 'keydown'].forEach(function (evt) {
                document.addEventListener(evt, function once() {
                    play();
                    document.removeEventListener(evt, once);
                }, { passive: true });
            });
        }

        return { play: play, pause: pause };
    })();

    window.GiftMusic = Music;
})();
