document.addEventListener('DOMContentLoaded', () => {

    const toast = document.createElement('div');
    toast.id = 'gb-toast';
    document.body.appendChild(toast);

    const style = document.createElement('style');
    style.innerHTML = `
        #gb-toast {
            visibility: hidden;
            min-width: 280px;
            max-width: 90%;
            background-color: #00a859;
            color: #ffffff;
            text-align: center;
            border-radius: 12px;
            padding: 16px 24px;
            position: fixed;
            left: 50%;
            bottom: 30px;
            transform: translateX(-50%) translateY(20px);
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        #gb-toast.show {
            visibility: visible;
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        #gb-toast-icon {
            font-size: 18px;
        }
    `;
    document.head.appendChild(style);

    let toastTimeout;
    function showToast(message, icon = '✓') {
        toast.innerHTML = `<span id="gb-toast-icon">${icon}</span> <span>${message}</span>`;
        toast.classList.add('show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000); 
    }

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });

        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
            });
        });
    }

    const cartButtons = document.querySelectorAll('.add-to-cart');
    cartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            const itemName = card.querySelector('.card-title').innerText;
            showToast(`"${itemName}" hozzáadva a kosárhoz!`, '🛒');
        });
    });

});