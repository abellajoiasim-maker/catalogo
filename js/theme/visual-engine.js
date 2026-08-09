/*
=========================================================
ABELLA VISUAL ENGINE
Visual Engine v2.0
IQ200 Architecture
=========================================================

Responsabilidades

✔ Detectar dispositivo
✔ Observer de componentes
✔ Lazy Images
✔ Reveal Animation
✔ Skeleton
✔ Ripple Buttons
✔ Hover Effects
✔ Auto Resize
✔ Scroll Effects
✔ Compatível com qualquer página

=========================================================
*/

(function(){

class VisualEngine{

    constructor(){

        this.initialized=false;

        this.isMobile=false;

        this.isTablet=false;

        this.isDesktop=false;

        this.observer=null;

    }

    init(){

        if(this.initialized){

            return;

        }

        this.detectDevice();

        this.applyBodyClasses();

        this.createIntersectionObserver();

        this.observeAnimations();

        this.observeImages();

        this.observeButtons();

        this.observeCards();

        this.observeModals();

        this.observeResize();

        this.initialized=true;

        console.log(
            "%cVisual Engine",
            "color:#16A34A;font-weight:bold",
            "READY"
        );

    }

    detectDevice(){

        const w=window.innerWidth;

        this.isMobile=w<768;

        this.isTablet=w>=768 && w<1024;

        this.isDesktop=w>=1024;

    }

    applyBodyClasses(){

        document.body.classList.remove(

            "mobile",

            "tablet",

            "desktop"

        );

        if(this.isMobile){

            document.body.classList.add("mobile");

        }

        if(this.isTablet){

            document.body.classList.add("tablet");

        }

        if(this.isDesktop){

            document.body.classList.add("desktop");

        }

    }

    createIntersectionObserver(){

        this.observer=new IntersectionObserver(

            entries=>{

                entries.forEach(entry=>{

                    if(entry.isIntersecting){

                        entry.target.classList.add("revealed");

                    }

                });

            },

            {

                threshold:.15

            }

        );

    }

    observeAnimations(){

        document

        .querySelectorAll(".reveal")

        .forEach(el=>{

            this.observer.observe(el);

        });

    }

    observeCards(){

        document

        .querySelectorAll(

            ".card,.produto-card,.categoria-card"

        )

        .forEach(card=>{

            card.classList.add("ve-card");

        });

    }

    observeButtons(){

        document

        .querySelectorAll("button")

        .forEach(btn=>{

            btn.classList.add("ve-button");

            btn.addEventListener(

                "click",

                e=>{

                    this.ripple(e);

                }

            );

        });

    }

    ripple(event){

        const button=event.currentTarget;

        const circle=document.createElement("span");

        const size=Math.max(

            button.clientWidth,

            button.clientHeight

        );

        circle.style.width=size+"px";

        circle.style.height=size+"px";

        circle.className="ve-ripple";

        const rect=button.getBoundingClientRect();

        circle.style.left=(event.clientX-rect.left-size/2)+"px";

        circle.style.top=(event.clientY-rect.top-size/2)+"px";

        const ripple=button.querySelector(".ve-ripple");

        if(ripple){

            ripple.remove();

        }

        button.appendChild(circle);

    }

    observeImages(){

        const imgs=document.querySelectorAll("img[data-src]");

        if(!imgs.length){

            return;

        }

        const lazy=new IntersectionObserver(

            entries=>{

                entries.forEach(entry=>{

                    if(entry.isIntersecting){

                        const img=entry.target;

                        img.src=img.dataset.src;

                        img.removeAttribute("data-src");

                        lazy.unobserve(img);

                    }

                });

            }

        );

        imgs.forEach(img=>lazy.observe(img));

    }

    observeResize(){

        window.addEventListener(

            "resize",

            ()=>{

                this.detectDevice();

                this.applyBodyClasses();

            }

        );

    }

    observeModals(){

        document

        .querySelectorAll(".modal")

        .forEach(modal=>{

            modal.classList.add("ve-modal");

        });

    }

    showSkeleton(target){

        target.classList.add("loading");

    }

    hideSkeleton(target){

        target.classList.remove("loading");

    }

    refresh(){

        this.observeAnimations();

        this.observeCards();

        this.observeButtons();

        this.observeImages();

        this.observeModals();

    }

}

window.VisualEngine=new VisualEngine();

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        window.VisualEngine.init();

    }

);

})();
