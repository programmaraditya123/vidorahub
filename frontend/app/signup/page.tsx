import LoginSignuppNav from '@/src/components/shared/loginsignupnav/LoginSignupNav'
import styles from '../page.module.css'
import VidorahubIcon from '@/src/icons/VidorahubIcon'
import LoginSignupForm from '@/src/components/shared/loginsignupform/LoginSignupForm'

export default function Signup(){
    return(
        <div className={styles.loginsignuptop}>
            <LoginSignuppNav/>
        <div className={styles.maindiv}>
            <div className={styles.lefttext}>
                <div className={styles.lsicon}><VidorahubIcon.VidorahubIcon color='purple' height={112} width={112}/></div>
                <div className={styles.lstext}>Join Vidorahub and start <br/>sharing.</div>        
            </div>
            <div className={styles.rightform}>
                <LoginSignupForm variant='secondary'/>
            </div>
        </div>
        
        </div>
)
}