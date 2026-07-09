/*
=========================================================
ABELLA VISUAL ENGINE
Theme Manager v2.0
IQ200 Architecture
=========================================================
Responsável por:

✔ carregar o tema
✔ carregar os css
✔ trocar tema dinamicamente
✔ impedir css duplicado
✔ fallback automático
✔ preparado para Firebase
=========================================================
*/

(function(){

class ThemeManager{

    constructor(){

        this.defaultTheme="modern";

        this.currentTheme=null;

        this.loadedFiles=new Set();

        this.initialized=false;

        this.themePath="themes";

        this.files=[

            "theme.css",

            "header.css",

            "cards.css",

            "buttons.css",

            "forms.css",

            "modal.css",

            "footer.css",

            "animations.css"

        ];

    }

    async init(){

        if(this.initialized) return;

        let theme=await this.loadThemeName();

        if(!theme){

            theme=this.defaultTheme;

        }

        await this.applyTheme(theme);

        this.initialized=true;

    }

    async loadThemeName(){

        try{

            /*
            Aqui posteriormente será ligado ao ConfigService.

            Exemplo:

            const cfg=await ConfigService.get();

            return cfg.theme;

            */

            if(window.catalogConfig){

                return window.catalogConfig.theme;

            }

            return this.defaultTheme;

        }catch(e){

            console.warn("ThemeManager:",e);

            return this.defaultTheme;

        }

    }

    async applyTheme(theme){

        if(this.currentTheme===theme){

            return;

        }

        this.removeTheme();

        this.currentTheme=theme;

        document.body.dataset.theme=theme;

        for(const css of this.files){

            this.loadCSS(css);

        }

        console.log(

            "%cTHEME",

            "color:#2563EB;font-weight:bold",

            theme

        );

    }

    loadCSS(file){

        const href=`${this.themePath}/${this.currentTheme}/${file}`;

        if(this.loadedFiles.has(href)){

            return;

        }

        const link=document.createElement("link");

        link.rel="stylesheet";

        link.href=href;

        link.dataset.theme=this.currentTheme;

        link.dataset.file=file;

        document.head.appendChild(link);

        this.loadedFiles.add(href);

    }

    removeTheme(){

        document

        .querySelectorAll("link[data-theme]")

        .forEach(link=>{

            link.remove();

        });

        this.loadedFiles.clear();

    }

    async change(theme){

        await this.applyTheme(theme);

    }

    getTheme(){

        return this.currentTheme;

    }

}

window.ThemeManager=new ThemeManager();

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        window.ThemeManager.init();

    }

);

})();
