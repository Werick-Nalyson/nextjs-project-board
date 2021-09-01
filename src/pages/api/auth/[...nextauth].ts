import NextAuth from "next-auth"
import Providers from "next-auth/providers"
import firebase from '../../../config/firebaseConnection';

export default NextAuth({
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: 'read:user'
    }),
  ],
  callbacks: {
    async session(session, profile) {
      try{

        const lastDonate = await firebase.firestore().collection('users')
        .doc(String(profile.sub))
        .get()
        .then((snapshot) => {
          if(snapshot.exists){
            return snapshot.data().lastDonate.toDate();
          }else{
            return null // Que esse user nao é apoiador
          }
        })

        return{
          ...session,
          id: profile.sub,
          vip: lastDonate ? true : false,
          lastDonate: lastDonate
        }

      }catch{
        return{
          ...session,
          id: null,
          vip: false,
          lastDonate: null
        }
      }

    },
    async signIn(user, account, profile) {
      try {
        return true
      } catch (err) {
        console.log('ERRO NO LOGIN')
        console.log(err)
        return false
      }
    }
  }
})