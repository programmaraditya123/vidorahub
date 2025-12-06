import LoginSignuppNav from '@/src/components/shared/loginsignupnav/LoginSignupNav'
import styles from '../page.module.css'
import VidorahubIcon from '@/src/icons/VidorahubIcon'
import LoginSignupForm from '@/src/components/shared/loginsignupform/LoginSignupForm'

export default function Login() {
    return(
        <div className={styles.loginsignuptop}>
            <LoginSignuppNav/>
        <div className={styles.maindiv}>
            <div className={styles.lefttext}>
                <div className={styles.lsicon}><VidorahubIcon.VidorahubIcon color='purple' height={112} width={112}/></div>
                <div className={styles.lstext}>Log in to your Vidorahub <br/>account.</div>        
            </div>
            <div className={styles.rightform}>
                <LoginSignupForm variant='primary'/>
            </div>
        </div>
        </div>
    )
}