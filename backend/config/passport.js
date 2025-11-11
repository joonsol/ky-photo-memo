require('dotenv').config()
const passport= require('passport')
const KakaoStrategy=require('passport-kakao').Strategy
const User=require('../models/User')


passport.use(
    new KakaoStrategy(
        {
            clientId:process.env.KAKAO_CLIENT_ID,
            clientSecret:process.env.KAKAO_CLIENT_SECRET,
            callbackURL:process.env.KAKAO_CALLBACK_URL
        },

        async(profile, done)=>{
            try {
                const kakaoId=profile.kakaoId
                const kakaoAccount=profile._json?.kakao_account|| {}
                const profileInfo = kakaoAccount.profile ||{}
                const email =kakaoAccount.email
                const nickname= profileInfo.ninkname

                let user = null

                user=await User.findOne({kakaoId})

                // 2
                if(!user && email){
                    user= await User.findOne({email:email.toLowerCase()})

                    if(user){
                        user.kakaoId=kakaoId
                        user.provider='kakao'

                        if(!user.displayName) user.displayName = nickname || user.email
                        if(!user.avatarUrl && profileInfo.profile_image_url){
                            user.avatarUrl=profileInfo.profile_image_url
                        } 

                        user.isActive=true

                        await user.save()
                    }

                }

                // 3
                if(!user){
                    user=await User.create({
                        kakaoId,
                        provider:"kakao",
                        email:email||undefined,
                        displayName:profileInfo.profile_image_url ||"",
                        isActive:true
                    })
                }

                return done(null, user)

            } catch (error) {
                console.error('kakao error',error)

                return done(error)
            }
        }
    )
)

