// Animação dos cards com IntersectionObserver (mais performático)
const cards = document.querySelectorAll('.tourist-card');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            card.classList.add('animate');

            // Lógica para carregar vídeos quando o card se torna visível
            const videos = card.querySelectorAll('video[data-src]');
            videos.forEach(video => {
                // Carrega o vídeo e remove o data-src para não carregar de novo
                video.src = video.dataset.src;
                video.removeAttribute('data-src');
                video.load(); // Inicia o carregamento do vídeo
            });

            // Para de observar o card depois que a animação e o carregamento foram iniciados
            observer.unobserve(card); 
        }
    });
}, {
    threshold: 0.1 // A animação começa quando 10% do card estiver visível
});

cards.forEach(card => {
    observer.observe(card);
});

// O smooth scroll já é feito pelo CSS: html { scroll-behavior: smooth; }
// A função JS abaixo não é mais necessária.
// document.querySelectorAll('a[href^="#"]').forEach(anchor => {
//     anchor.addEventListener('click', function (e) {
//         e.preventDefault();
//         document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
//     });
// });

// Efeito de parallax no hero (otimizado para mais fluidez)
const hero = document.querySelector('.hero');
let lastKnownScrollPosition = 0;
let ticking = false;

function doParallax(scrollPos) {
    if (hero) {
        const rate = scrollPos * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
}

// Event listeners
window.addEventListener('scroll', function() {
    lastKnownScrollPosition = window.pageYOffset;

    if (!ticking) {
        window.requestAnimationFrame(function() {
            doParallax(lastKnownScrollPosition);
            ticking = false;
        });

        ticking = true;
    }
}, { passive: true });

// Lógica para o Modal da Galeria (Lightbox) com Navegação
const modal = document.getElementById("gallery-modal");
const modalImg = document.getElementById("modal-image");
const modalVideo = document.getElementById("modal-video");
const captionText = document.getElementById("modal-caption");
const closeModalBtn = document.querySelector(".modal-close");
const modalPrevBtn = document.querySelector(".modal-nav.prev");
const modalNextBtn = document.querySelector(".modal-nav.next");

let currentGallery = [];
let currentIndex = 0;

function openModalWith(gallery, startIndex) {
    currentGallery = gallery;
    currentIndex = startIndex;
    showItemInModal(currentIndex);
    modal.classList.add('active');
    lucide.createIcons(); // Renderiza os ícones de seta no modal
}
 
const mainGalleryGrid = document.querySelector('.gallery-grid');
if (mainGalleryGrid) {
    mainGalleryGrid.addEventListener('click', function(e) {
        const clickedItem = e.target.closest('.gallery-item');
        if (!clickedItem) return;
 
        const visibleItems = Array.from(this.querySelectorAll('.gallery-item:not(.hidden)'));
        const clickedIndex = visibleItems.indexOf(clickedItem);
 
        const galleryData = visibleItems.map(item => {
            const style = window.getComputedStyle(item);
            const bgImage = style.getPropertyValue('--bg-image').match(/url\(['"]?(.*?)['"]?\)/);
            return { type: 'image', src: bgImage ? bgImage[1] : '', title: item.getAttribute('data-title') || '' };
        });
 
        openModalWith(galleryData, clickedIndex);
    });
}

function showNextImage() {
    if (currentGallery.length === 0) return;
    currentIndex = (currentIndex + 1) % currentGallery.length;
    showItemInModal(currentIndex);
}

function showPrevImage() {
    if (currentGallery.length === 0) return;
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    showItemInModal(currentIndex);
}

modalNextBtn.addEventListener('click', showNextImage);
modalPrevBtn.addEventListener('click', showPrevImage);

function closeModal() {
    modal.classList.remove('active');
    // Pausa o vídeo ao fechar o modal para não continuar tocando o som
    modalVideo.pause();
    modalVideo.src = ""; // Limpa o source
}

closeModalBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    // Fecha se clicar no fundo, mas não nas setas
    if (e.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;

    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") showNextImage();
    if (e.key === "ArrowLeft") showPrevImage();
});

// Lógica para o botão "Veja Mais" da galeria
const loadMoreBtn = document.getElementById('load-more-btn');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
        const hiddenItems = document.querySelectorAll('.gallery-item.hidden');
        hiddenItems.forEach(item => {
            item.classList.remove('hidden');
        });

        // Esconde o botão depois de carregar as imagens
        this.style.display = 'none';
    });
}

// Inicializa os mini-carrosséis dos cards
document.querySelectorAll('.tourist-card').forEach(card => {
    const container = card.querySelector('.card-image');
    if (!container) return;

    const prevBtn = container.querySelector('.card-nav.prev');
    const nextBtn = container.querySelector('.card-nav.next');

    // Lógica para gerar mídia dinamicamente a partir de data-attributes
    if (card.dataset.galleryItems) {
        try {
            const items = JSON.parse(card.dataset.galleryItems);
            items.forEach((item, index) => {
                let mediaElement;
                if (item.type === 'image') {
                    const picture = document.createElement('picture');

                    const jpgSource = document.createElement('source');
                    jpgSource.srcset = `${item.path}.jpg`;
                    jpgSource.type = 'image/jpeg';

                    const img = document.createElement('img');
                    img.src = `${item.path}.jpg`;
                    img.alt = card.querySelector('.card-title').textContent;
                    img.classList.add('card-img');
                    img.loading = 'lazy';
                    if (index === 0) img.classList.add('active');

                    picture.append(jpgSource, img);
                    mediaElement = picture;

                } else if (item.type === 'video') {
                    mediaElement = document.createElement('video');
                    mediaElement.dataset.src = `${item.path}.mp4`;
                    mediaElement.classList.add('card-img');
                    mediaElement.muted = true;
                    mediaElement.loop = true;
                    mediaElement.playsInline = true;
                    mediaElement.poster = item.poster || '';
                    mediaElement.dataset.alt = item.alt || 'Vídeo';
                    mediaElement.preload = 'none';
                }
                // Insere a mídia antes dos botões de navegação para manter o z-index
                if (mediaElement) container.insertBefore(mediaElement, prevBtn);
            });
        } catch (e) { console.error('Erro ao parsear JSON da galeria do card:', e); }
    }

    const mediaItems = container.querySelectorAll('.card-img');
    let currentIndex = 0;

    // Se houver 1 foto ou menos, esconde as setas
    if (mediaItems.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    }

    function showImage(index) {
        mediaItems.forEach((media, i) => {
            const isActive = i === index;
            media.classList.toggle('active', isActive);

            // Pausa vídeos que não estão ativos e toca o que está ativo
            if (media.tagName === 'VIDEO') {
                if (isActive) {
                    // Tenta tocar o vídeo (pode falhar por políticas do browser, o .catch evita erro no console)
                    media.play().catch(() => {}); 
                } else {
                    media.pause();
                    media.currentTime = 0; // Reinicia o vídeo
                }
            }
        });
    }

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede que o clique afete outros elementos
        currentIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length;
        showImage(currentIndex);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % mediaItems.length;
        showImage(currentIndex);
    });
});

// Lógica para o botão "Ver mais" nos cards de descrição longa
document.querySelectorAll('.card-content').forEach(cardContent => {
    const readMoreBtn = cardContent.querySelector('.read-more-btn');
    const expandableText = cardContent.querySelector('.expandable-text');

    if (readMoreBtn && expandableText) {
        readMoreBtn.addEventListener('click', function() {
            const isExpanded = expandableText.classList.toggle('expanded');
            this.textContent = isExpanded ? 'Ver menos' : 'Ver mais';
        });
    }
});

function getGalleryDataFromCard(card) {
    const cardTitle = card.querySelector('.card-title').textContent;
    let galleryData = [];

    // Prioriza a galeria do data-attribute se existir
    if (card.dataset.galleryItems) {
        try {
            const items = JSON.parse(card.dataset.galleryItems);
            galleryData = items.map(item => ({
                type: item.type,
                src: item.type === 'image' ? `${item.path}.jpg` : `${item.path}.mp4`,
                title: `${cardTitle} - ${item.alt || (item.type === 'image' ? 'Foto' : 'Vídeo')}`
            }));
        } catch (e) {
            console.error('Erro ao parsear JSON da galeria do card:', e);
            return [];
        }
    }
    return galleryData;
}

// Lógica para o botão "Ver galeria" nos cards
document.querySelectorAll('.view-gallery-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = e.target.closest('.tourist-card');
        if (!card) return;
        const galleryData = getGalleryDataFromCard(card);
        if (galleryData.length === 0) return;

        currentIndex = 0; // Começa da primeira imagem da galeria do card
        openModalWith(galleryData, currentIndex);
    });
});

function showItemInModal(index) {
    // Pausa e esconde o vídeo antes de trocar
    modalVideo.pause();
    modalVideo.style.display = 'none';
    modalImg.style.display = 'none';

    const item = currentGallery[index];
    if (!item) return;

    if (item.type === 'image') {
        modalImg.src = item.src;
        modalImg.style.display = 'block';
    } else if (item.type === 'video') {
        modalVideo.src = item.src;
        modalVideo.style.display = 'block';
        modalVideo.play();
    }

    captionText.innerHTML = item.title;
    lucide.createIcons();
}


// Lógica para o menu hambúrguer
const navToggle = document.querySelector('.mobile-nav-toggle');
const mainNav = document.querySelector('.main-nav');
const iconMenu = navToggle.querySelector('.icon-menu');
const iconClose = navToggle.querySelector('.icon-close');

navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('nav-open', isOpen);

    // Alterna os ícones
    iconMenu.style.display = isOpen ? 'none' : 'block';
    iconClose.style.display = isOpen ? 'block' : 'none';
});

// Fecha o menu ao clicar em um link
mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        document.body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        iconMenu.style.display = 'block';
        iconClose.style.display = 'none';
    });
});

// Lógica para o botão "Voltar ao Topo"
const backToTopBtn = document.querySelector('.back-to-top-btn');

if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        // Mostra o botão após rolar uma altura de 400px
        if (window.scrollY > 400) { 
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }, { passive: true }); // Otimização de performance
}

// Lógica para destacar o link ativo no menu durante o scroll (Scrollspy)
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.main-nav a');

const observerOptions = {
    root: null, // Observa em relação ao viewport
    rootMargin: '-70px 0px -50% 0px', // O topo é a altura do header, o fundo é 50% da tela
    threshold: 0
};

const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            
            // Remove a classe 'active' de todos os links
            navLinks.forEach(link => {
                link.classList.remove('active');
            });

            // Adiciona a classe 'active' ao link correspondente
            const activeLink = document.querySelector(`.main-nav a[href="#${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

setTimeout(() => {
    // Render Lucide icons
    // O timeout garante que todos os elementos foram carregados antes de renderizar os ícones
    lucide.createIcons();
}, 0);

// Lógica para a galeria de vídeos do Paramotor
const paramotorGallery = document.querySelector('.paramotor-video-gallery');
if (paramotorGallery) {
    const mainVideo = document.getElementById('main-paramotor-video');
    const thumbnails = paramotorGallery.querySelectorAll('.thumbnail-video');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            // Remove a classe 'active' de todas as miniaturas
            thumbnails.forEach(t => t.classList.remove('active'));
            
            // Adiciona a classe 'active' à miniatura clicada
            this.classList.add('active');

            // Troca o vídeo principal e o reproduz
            const newSrc = this.dataset.videoSrc;
            if (mainVideo.src !== newSrc) {
                mainVideo.src = newSrc;
                mainVideo.play();
            }
        });
    });
}