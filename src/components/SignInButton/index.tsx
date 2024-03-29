
import styles from './styles.module.scss';
import { signIn, signOut, useSession } from 'next-auth/client'
import { FaGithub } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'


export function SignInButton(){
  const [session] = useSession()

  return session ? (
    <button
    type="button"
    className={styles.signInButton}
    onClick={ () => signOut() }
    >
      <img src={session.user.image} />
      Olá, {session.user.name}
      <FiX color="#737380" className={styles.closeIcon} />
    </button>
  ) : (
    <button
    type="button"
    className={styles.signInButton}
    onClick={ () => signIn('github') }
    >
      <FaGithub color="#FFB800"/>
      Entrar com github
    </button>
  )
}