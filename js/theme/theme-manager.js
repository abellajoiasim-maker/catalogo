class ThemeManager {

    constructor(){
        this.currentTheme = "modern";
        this.loaded = false;
    }

    async init(){

        const config = await this.loadThemeConfig();

        this.currentTheme = config || "modern";

        await this.loadTheme(this.currentTheme);

        this.loaded = true;

    }

    async loadThemeConfig(){

        // ler Firebase

    }

    async loadTheme(theme){

        // carregar CSS

    }

    injectCSS(file){

        // cria link

    }

}

window.ThemeManager = new ThemeManager();
