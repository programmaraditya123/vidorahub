import styles from "../../../app/profile/Profile.module.scss";


const images = [
  { cls: styles.masonryTall, title: "Neon Tokyo: 2099 Cinematic", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrtxoWuINlBhxtH3WSTt-vLvE3r51l15l5kPFuVAYIFUpCPhdzhdsgLJsYHLtfy-6LDF4kEPVOhnOziN3Wo60LQ23Pp-6wurL1e3aZTauExBdFyjVWm0KKR0s26uAVEarvdzQgLqYgFz92yeqaFgOYdCIbc2i_EXoIOj_PJPNFYy0r920311lcJCYIt_oNOSu1skhVPrLRfxWig2c3zL4zIBsJxaDh3q_MAdqGULvDzTM9zLWhaNrOKdScXE0X_GGeCEtguJ40-avN" },
  { cls: styles.masonryMed, title: "Liquid Metal Simulations", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzPOMqj_wLiu8_1wDqsJ1-jNYXOdzrRVNDmiiFmOeIS-aC46tl9b-kDXEV4IKwvnlPHZN1h-PqjpExVMPGcCBK34qz_w-FA2t5aur5biFJplKh7E8p1_hBlrY_HBR1JWlMWurtY643aQe9g6G6KMCpIJqHudYPOrcqPR78T7RWEy45S1MZfajmobvxAS4V2Qu-OWOeBO_dC1XYUEIeR2md-GyLqMOHMkTNxocOlx7_oF4pSaDGYqX98iT0uzkDtvI54dgzI4bFm5NJ" },
  { cls: styles.masonryShort, title: "Midnight Reflections", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAaOalpHhnLj9Q07sZSrKwtylpyfFzyVjVsAueuSDsj06aECiavh23u9P3iNOgzyLDdCnrdLu2stq_mavVupgWiv9mvDDhydnroyu1lFsYTZa_Q87_jroRhK_MIDtEBcdRhkpohdkQK46CAy_QCV5u-lZ0pql-ZcOz_6CKl8s3n1l-5Db5UZC07QkDzwaZsoC0jE0A-8NP6Fk28yrmB69ZpN3sfvXZ0KqJ4CHZrE6f1E8Q5n0hjzCRX9uyiyMOzGwh923b6uA2jwRD" },
  { cls: styles.masonryTall, title: "Interdimensional Travel V2", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbL1mlUiz73GElrADl-TFfZ_tyoPj2yeA2s4jqU3JgYpOqT4QgIb83szuYfw8iDReu3PM4q30-_YcW3IcdCsbs96rQWgE5czsBcKisnhv3kdTgpyx656nRDL-3kgZ-YLr_hoo-VIFEGFkbART9wwRyAEauudbpsif9NAtJ6TiTHZFJmPVmz02vG5lNkDEH5bZTZ7uI4As6uoanvxYMarHEImwsZ74VTJufiCe8p2BkaAoredAFsPJpbIpg_5aU0AzJHzMItRj0OxaZ" },
  { cls: styles.masonryMed, title: "The Future of Data", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDI7Tu3n8PdYMVNTeo1tqkLeNC4qPq3FnkYity3QdVJkOh4QbdxCycev3af7OIu2gZdtoonp_pihYCu6s4Ou5K4eDEZKuUFnSLx-F24EfLEd7LTKBtrUtXT3m0vMGkCOYDkYo8b0NyJ94qAFdxPPBe8ozF3VfOay8PBlq7WS1ZYzVPQhiuSs-blqiFzQyojNT4PNE3AOpdMlxaJh8wyehNelmSFnKQXgkv9HfRF0LLI313tK0LPDoIasbTOL7c_8eevaMY7cf94Re1x" }
];

export default function MasonryGrid() {
  return (
    <div className={styles.masonry}>
      {images.map((item, i) => (
        <div key={i} className={`${styles.card} ${item.cls} ${styles.glass}`}>
          <div
            className={styles.cardBg}
            style={{ backgroundImage: `url(${item.img})` }}
          />
          <div className={styles.cardOverlay}>
            <p>{item.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
