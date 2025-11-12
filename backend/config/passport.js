// config/passport.js
require("dotenv").config();
const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;
const User = require("../models/User");
console.log(process.env.KAKAO_CALLBACK_URL)
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_CALLBACK_URL,
    },
      async (accessToken, refreshToken, profile, done) => {
      try {
        const kakaoId = profile.id;
        const kakaoAccount = profile._json?.kakao_account || {};
        const profileInfo = kakaoAccount.profile || {};

        const email = kakaoAccount.email;
        const nickname = profileInfo.nickname;

        let user = null;

        // 1) kakaoId로 먼저 찾기
        user = await User.findOne({ kakaoId });

        // 2) kakaoId로는 없는데, 이메일이 있고 그 이메일로 기존 유저가 있으면 → 그 유저에 kakaoId 붙이기 (연동)
        if (!user && email) {
          user = await User.findOne({ email: email.toLowerCase() });
          if (user) {
            user.kakaoId = kakaoId;
            user.provider = "kakao";
            if (!user.displayName) user.displayName = nickname || user.email;
            if (!user.avatarUrl && profileInfo.profile_image_url) {
              user.avatarUrl = profileInfo.profile_image_url;
            }
            user.isActive = true;
            await user.save();
          }
        }

        // 3) 위에서 다 못 찾으면 → 새 계정 생성 (일반 유저)
        if (!user) {
          user = await User.create({
            kakaoId,
            provider: "kakao",
            email: email || undefined,
            displayName: nickname || "카카오유저",
            avatarUrl: profileInfo.profile_image_url || "",
            isActive: true,
            // role: "user"  // 스키마 default가 user니까 생략 가능
          });
        }

        return done(null, user);
      } catch (err) {
        console.error("KakaoStrategy error:", err);
        return done(err);
      }
    }
  )
);

module.exports = passport;
