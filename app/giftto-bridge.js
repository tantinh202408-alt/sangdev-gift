(function () {
    var parentApp = null;
    try {
        if (window.parent && window.parent !== window && window.parent.__GIFTTO_APP) {
            parentApp = window.parent.__GIFTTO_APP;
        }
    } catch (e) {}
    if (!parentApp && window.__GIFTTO_APP) {
        parentApp = window.__GIFTTO_APP;
    }

    var now = new Date();
    var curDay = now.getDate();
    var curMonth = now.getMonth() + 1;
    var isMensDaySeason = (curMonth === 11 && curDay >= 1 && curDay <= 19);

    var defaultConfig = {
        appTitle: isMensDaySeason ? "Món Quà Nhỏ 19/11 - Dành riêng cho Anh 🎁" : "Món Quà Nhỏ - Dành riêng cho người thương 💖",
        appIcon: "./assets/images/icons/couple.png",
        enableWebsiteInfo: true,
        enablePasscode: false,
        passcode: isMensDaySeason ? "1911" : String(curDay).padStart(2, '0') + String(curMonth).padStart(2, '0'),
        passcodeTitle: "Nhập mật khẩu",
        passcodeSubtitle: isMensDaySeason ? "Gợi ý: Ngày Quốc tế Nam giới (1911)" : "Gợi ý: Ngày hôm nay (4 chữ số)",
        enableMorphEffect: true,
        morphTexts: isMensDaySeason
            ? ["Chúc mừng", "Ngày Quốc tế Nam giới", "19 tháng 11", "Cảm ơn anh vì tất cả"]
            : ["Gửi người thương", "Một món quà nhỏ", "Dành riêng cho bạn", "Mãi bên nhau nhé"],
        particleImage: "./assets/demo/particle.png",
        particleImageShape: "heart",
        particleColor: isMensDaySeason ? "#f5b82e" : "",
        heartName: isMensDaySeason ? "Anh Yêu" : "Thương",
        enableSphere: true,
        sphereImages: [
            "./assets/demo/sphere-0.jpg",
            "./assets/demo/sphere-1.jpg",
            "./assets/demo/sphere-2.jpg",
            "./assets/demo/sphere-3.jpg",
            "./assets/demo/sphere-4.jpg",
            "./assets/demo/sphere-5.jpg"
        ],
        enableSphereFlyingImages: true,
        flyingCaptions: isMensDaySeason
            ? ["Thương anh nhất 💕", "Điểm tựa của em 🥰", "Luôn vững vàng nhé ✨", "Mãi bên nhau nhé 💑"]
            : ["Thương thật nhiều 💕", "Khoảnh khắc đẹp nhất ✨", "Mãi bên nhau nhé 🥰", "Luôn rạng rỡ nhé 🌸"],
        enableLetter: true,
        letter: {
            title: isMensDaySeason ? "Gửi anh yêu!" : "Gửi người thương!",
            text: isMensDaySeason
                ? "Nhân ngày Quốc tế Nam giới 19/11, chúc người đàn ông của em luôn mạnh khỏe, bình an, vững vàng và hạnh phúc trên mọi chặng đường.\n\nCảm ơn anh vì đã luôn chở che, nhường nhịn và yêu thương em! ❤️"
                : "Chẳng cần phải đợi đến một ngày lễ đặc biệt nào cả, vì mỗi ngày có bạn ở bên đều là một ngày thật đáng trân trọng.\n\nChúc bạn luôn bình an, rạng rỡ, ngập tràn niềm vui và luôn cảm nhận được thật nhiều yêu thương mỗi ngày nhé! ❤️",
            image: "./assets/demo/letter.png",
            caption: isMensDaySeason ? "Mình mãi bên nhau anh nhé ♥" : "Khoảnh khắc đẹp của chúng mình ♥",
            signature: isMensDaySeason ? "Người thương của anh ♥" : "Thương nhiều ♥",
            envColor: isMensDaySeason ? "navy" : "night"
        },
        bgMusic: "./assets/music/givemeyourforever.mp3",
        bgVolume: 0.55,
        autoPlay: false,
        recipientName: isMensDaySeason ? "Anh Yêu" : "Người Thương",
        enableCalendar: true,
        calendar: {
            day: isMensDaySeason ? 19 : curDay,
            month: isMensDaySeason ? 11 : curMonth,
            title: isMensDaySeason ? "Ngày Quốc tế Nam giới" : "Ngày Đặc Biệt Của Chúng Mình",
            caption: isMensDaySeason ? "Ngày của anh ♥" : "Dành tặng người thương ♥"
        },
        enableBouquet: true,
        bouquet: {
            count: 9,
            color: "red",
            title: isMensDaySeason ? "Tặng anh bó hoa không bao giờ tàn" : "Tặng bạn bó hoa không bao giờ tàn",
            meaning: "Mãi mãi bên nhau",
            subtitle: isMensDaySeason
                ? "Cảm ơn anh vì đã luôn là điểm tựa vững chắc và dịu dàng nhất của em."
                : "Hoa thật rồi sẽ héo, nhưng bó hoa này sẽ nở mãi — như tình cảm chân thành dành cho bạn mỗi ngày."
        },
        enableGiftBox: true,
        giftBox: {
            color: isMensDaySeason ? "navy" : "pink",
            message: isMensDaySeason
                ? "Tối 19/11, 7 giờ — mình đi ăn tối kỷ niệm nhé anh! Em khao! 🥂✨"
                : "Một buổi hẹn đi ăn món ngon bạn thích vào cuối tuần này nhé! 🍲✨",
            image: "./assets/demo/giftbox.jpg"
        },
        enableFinale: true,
        finale: {
            texts: isMensDaySeason ? ["19.11", "Thương Anh", "Mãi Bên Nhau"] : ["Yêu Thương", "Mãi Bên Nhau"],
            message: isMensDaySeason ? "Cảm ơn anh vì đã đến bên em" : "Cảm ơn vì đã luôn ở bên nhau",
            loveStart: "2024-02-14",
            counterLabel: "Mình đã bên nhau"
        }
    };

    var finalConfig = Object.assign({}, defaultConfig, (parentApp && parentApp.config) ? parentApp.config : {});
    if (parentApp && parentApp.config && parentApp.config.letter) {
        finalConfig.letter = Object.assign({}, defaultConfig.letter, parentApp.config.letter);
    }
    if (parentApp && parentApp.config && parentApp.config.calendar) {
        finalConfig.calendar = Object.assign({}, defaultConfig.calendar, parentApp.config.calendar);
    }
    if (parentApp && parentApp.config && parentApp.config.bouquet) {
        finalConfig.bouquet = Object.assign({}, defaultConfig.bouquet, parentApp.config.bouquet);
    }
    if (parentApp && parentApp.config && parentApp.config.giftBox) {
        finalConfig.giftBox = Object.assign({}, defaultConfig.giftBox, parentApp.config.giftBox);
    }
    if (parentApp && parentApp.config && parentApp.config.finale) {
        finalConfig.finale = Object.assign({}, defaultConfig.finale, parentApp.config.finale);
    }
    if (parentApp && parentApp.music) {
        finalConfig.bgMusic = parentApp.music;
    }

    window.DEFAULT_APP_CONFIG = defaultConfig;
    window.APP_CONFIG = finalConfig;
    window.APP_CONFIG_PROMISE = Promise.resolve(finalConfig);

    if (finalConfig.appTitle) {
        document.title = finalConfig.appTitle;
    }
    if (!finalConfig.enablePasscode) {
        var pcEl = document.getElementById('passcodeScreen');
        if (pcEl) pcEl.style.display = 'none';
    }
})();
