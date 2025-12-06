import VidorahubIcon from '@/src/icons/VidorahubIcon';
import styles from './Navbar2.module.scss'
import Link from 'next/link';

const Navbar2 = () => {
    return(
        <div className={styles.fullbar}>
            <Link href={'/'}>
            <div className={styles.icontext}>
                <div className={styles.logo}><VidorahubIcon.VidorahubIcon height={28} width={28} color='purple'/></div>
                <h1 className={styles.text}>Vidorahub</h1>
            </div>

            </Link>
            
            <div className={styles.rightpart}>
                <div className={styles.theme}><VidorahubIcon.MoonIcon height={28} width={28}/></div>
                <div className={styles.notificationicon}><VidorahubIcon.BellAlertIcon height={28} width={28}/></div>
                <div className={styles.userprofile}>
                    <img src={'/a'} alt='user'/>
                </div>
            </div>
        </div>
    )
};

export default Navbar2;