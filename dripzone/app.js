// --- DOM Elements ---
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsContainer = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotalPrice = document.getElementById('cartTotalPrice');

const userBtn = document.getElementById('userBtn');
const authModal = document.getElementById('authModal');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const authOverlay = document.getElementById('authOverlay');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authMessage = document.getElementById('authMessage');

// --- State ---
let cart = JSON.parse(localStorage.getItem('dripzone_cart')) || [];
let currentUser = localStorage.getItem('dripzone_user') || null;

// --- Initialize ---
function init() {
    updateCartUI();
    updateUserUI();
    setupColorSelection();
    renderProducts();
}

// --- User / Auth Logic ---
function updateUserUI() {
    if (!userBtn) return;

    const adminNavBtn = document.getElementById('adminNavBtn');
    const ADMIN_EMAILS = ['admin', 'admin@dripzone.com', 'tanmaymicroft2010@gmail.com', 'tanmaymicrosoft2010@gmail.com', 'chainpur345@gmail.com'];

    if (currentUser) {
        userBtn.innerHTML = '<i class="ph-fill ph-user-check" style="color: green;"></i>';
        if (adminNavBtn) {
            if (ADMIN_EMAILS.includes(currentUser)) {
                adminNavBtn.style.display = 'block';
            } else {
                adminNavBtn.style.display = 'none';
            }
        }
    } else {
        userBtn.innerHTML = '<i class="ph ph-user"></i>';
        if (adminNavBtn) adminNavBtn.style.display = 'none';
    }
}

if (userBtn) {
    userBtn.addEventListener('click', () => {
        const ADMIN_EMAILS = ['admin', 'admin@dripzone.com', 'tanmaymicroft2010@gmail.com', 'tanmaymicrosoft2010@gmail.com', 'chainpur345@gmail.com'];
        if (currentUser) {
            if (ADMIN_EMAILS.includes(currentUser)) {
                if (confirm("Logged in as Admin. Go to Dashboard?\nPress Cancel to Log Out instead.")) {
                    window.location.href = 'admin.html';
                } else {
                    handleSecureLogout();
                }
            } else {
                if (confirm(`Logged in securely as ${currentUser}.\nDo you want to log out?`)) {
                    handleSecureLogout();
                }
            }
        } else {
            openAuth();
        }
    });
}

function openAuth() {
    authModal.classList.add('active');
    authOverlay.classList.add('active');
    authMessage.textContent = '';
}

function closeAuth() {
    authModal.classList.remove('active');
    authOverlay.classList.remove('active');
}

closeAuthBtn.addEventListener('click', closeAuth);
authOverlay.addEventListener('click', closeAuth);

// --- Firebase Real Initialization ---
// IMPORTANT: Replace this config with your actual Firebase Project config!
const firebaseConfig = {
    apiKey: "AIzaSyC8DFufuOnJeoQ2aZNnfNB9ikeFUAfoawA",
    authDomain: "dripzone-bde8d.firebaseapp.com",
    projectId: "dripzone-bde8d",
    storageBucket: "dripzone-bde8d.firebasestorage.app",
    messagingSenderId: "961955077163",
    appId: "1:961955077163:web:49bcdffab68c71e036de6e",
    measurementId: "G-RLQK5YTY3M"
};

// Initialize Firebase only once safely
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const googleProvider = typeof firebase !== 'undefined' ? new firebase.auth.GoogleAuthProvider() : null;

if (auth) {
    // 1. Listen to Global Auth State Securely
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user.email;
            localStorage.setItem('dripzone_user', user.email); // Keep for backwards compatibility
        } else {
            currentUser = null;
            localStorage.removeItem('dripzone_user');
            localStorage.removeItem('dripzone_cart'); // Clear cart on logout
        }
        updateUserUI();
    });

    // 2. Handle Login Form (Passwordless Magic Link)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const magicLinkBtn = document.getElementById('magicLinkBtn');
            const originalText = magicLinkBtn.innerHTML;

            magicLinkBtn.innerHTML = '<i class="ph-bold ph-spinner" style="animation: spin 1s linear infinite;"></i> Sending...';

            const actionCodeSettings = {
                url: window.location.href, // Redirect back to current page
                handleCodeInApp: true
            };

            auth.sendSignInLinkToEmail(email, actionCodeSettings)
                .then(() => {
                    window.localStorage.setItem('emailForSignIn', email);
                    authMessage.style.color = 'green';
                    authMessage.textContent = 'Magic link sent! Check your inbox.';
                    magicLinkBtn.innerHTML = originalText;
                    loginForm.reset();
                })
                .catch((error) => {
                    authMessage.style.color = 'red';
                    authMessage.textContent = 'Error sending link. (Did you add your real Firebase API Key?)';
                    console.error(error);
                    magicLinkBtn.innerHTML = originalText;
                });
        });
    }

    // 3. Intercept Magic Link on Page Load
    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = prompt('Please provide your email for confirmation');
        }
        if (email) {
            auth.signInWithEmailLink(email, window.location.href)
                .then((result) => {
                    window.localStorage.removeItem('emailForSignIn');
                    // onAuthStateChanged handles the rest
                })
                .catch((error) => {
                    console.error("Error signing in with magic link", error);
                });
        }
    }

    // 4. Handle Real Google Auth Popup
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            const originalText = googleLoginBtn.innerHTML;
            googleLoginBtn.innerHTML = '<i class="ph-bold ph-spinner" style="animation: spin 1s linear infinite;"></i> Connecting...';

            auth.signInWithPopup(googleProvider)
                .then((result) => {
                    closeAuth();
                    googleLoginBtn.innerHTML = originalText;
                })
                .catch((error) => {
                    authMessage.style.color = 'red';
                    authMessage.textContent = 'Google Auth Error. Add your Firebase keys in app.js!';
                    console.error(error);
                    googleLoginBtn.innerHTML = originalText;
                });
        });
    }
}

function handleSecureLogout() {
    if (auth) {
        auth.signOut().then(() => {
            if (window.location.href.includes('admin.html') || window.location.href.includes('checkout.html')) {
                window.location.href = 'index.html';
            }
        });
    }
}

// --- Cart Logic ---
function openCart() {
    cartModal.classList.add('active');
    cartOverlay.classList.add('active');
}

function closeCart() {
    cartModal.classList.remove('active');
    cartOverlay.classList.remove('active');
}

if (cartBtn) cartBtn.addEventListener('click', openCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

// --- Hamburger Menu Logic ---
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navLinks = document.querySelector('.nav-links');

if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('active');
        const icon = hamburgerBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.className = 'ph ph-x';
        } else {
            icon.className = 'ph ph-list';
        }
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburgerBtn.querySelector('i').className = 'ph ph-list';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            navLinks.classList.remove('active');
            hamburgerBtn.querySelector('i').className = 'ph ph-list';
        }
    });
}

function addToCart(product) {
    cart.push(product);
    localStorage.setItem('dripzone_cart', JSON.stringify(cart));
    updateCartUI();
    openCart(); // Show cart when item is added
}

window.addToCart = addToCart; // Make globally accessible for onclick in HTML

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('dripzone_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    cartCount.textContent = cart.length;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#888; margin-top:2rem;">Your cart is empty.</p>';
        cartTotalPrice.textContent = '0';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-price">₹${item.price}</div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartTotalPrice.textContent = total;
}

// Checkout Guard logic
const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert('You must be logged in to checkout.');
            closeCart();
            openAuth();
        } else if (cart.length === 0) {
            alert('Your cart is empty.');
        } else {
            window.location.href = 'checkout.html';
        }
    });
}

// --- Interactive Elements ---
function setupColorSelection() {
    const dots = document.querySelectorAll('.color-dot');
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            // Adding a small scale bounce to the hero image for effect
            const heroImage = document.querySelector('.hero-image');
            heroImage.style.transform = 'scale(0.98)';
            heroImage.style.opacity = '0.7';

            setTimeout(() => {
                heroImage.style.transform = 'scale(1)';
                heroImage.style.opacity = '1';
                heroImage.style.transition = 'all 0.3s ease';
            }, 100);
        });
    });
}

// --- Dynamic Store Rendering ---
function renderProducts() {
    const productsGrid = document.getElementById('dynamicProductsList');
    const accessoriesGrid = document.getElementById('dynamicAccessoriesList');

    if (!productsGrid || typeof storeProducts === 'undefined') return;

    productsGrid.innerHTML = '';
    if (accessoriesGrid) accessoriesGrid.innerHTML = '';

    storeProducts.forEach(product => {
        // Build card HTML securely
        const productHtml = `
            <div class="secondary-product-card glass shop-card">
                <a href="product.html?id=${product.id}" class="shop-card-link">
                    <img src="${product.image}" loading="lazy" class="smooth-img shop-card-img" onload="this.classList.add('loaded')" alt="${product.name}">
                    <h3 class="shop-card-title">${product.name}</h3>
                    <p class="shop-card-price">${product.originalPrice ? `<span class="original-price-small">₹${product.originalPrice}</span>` : ''}₹${product.price}</p>
                </a>
                <button class="sec-add shop-card-btn" onclick="addToCart({id:${product.id}, name:'${product.name}', price:${product.price}, img:'${product.image}'})">Add to Cart</button>
            </div>
        `;

        productsGrid.innerHTML += productHtml;
        if (accessoriesGrid && product.category === 'Accessories') {
            accessoriesGrid.innerHTML += productHtml;
        }
    });

    // Initialize Lightweight 3D Hover engine
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll(".secondary-product-card, .drop-capsule"), {
            max: 12,
            speed: 500,
            glare: true,
            "max-glare": 0.25,
            scale: 1.05
        });
    }

    // Attach 3D float class to hero image
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        heroImage.classList.add('float-3d');
    }
}

// Run init
init();
