import VidorahubIcon from '@/src/icons/VidorahubIcon';
import styles from './homenavbar.module.scss'

const HomeNavbar = () => {
    return(
        <div className={styles.topnav}>
            <div className={styles.navsearch}>
                <input type='text' placeholder='Search ...'/>
            </div>
            <div className={styles.navright}>
                <div className={styles.notification}>
                    <VidorahubIcon.BellAlertIcon height={28} width={28}/>

            </div>
            <div className={styles.profile}>
                <VidorahubIcon.UserIcon height={28} width={28}/>

            </div>

            </div>
            
        </div>
    )
}

export default HomeNavbar;