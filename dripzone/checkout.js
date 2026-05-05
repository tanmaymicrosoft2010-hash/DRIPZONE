// Robust 3-Step Checkout Logic with Razorpay Simulation
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard
    const loggedUser = localStorage.getItem('dripzone_user');
    if (!loggedUser) {
        alert("Authentication Required. Please log in to checkout.");
        window.location.href = 'index.html';
        return;
    }

    // 2. Cart Verification
    const cartData = JSON.parse(localStorage.getItem('dripzone_cart')) || [];
    if (cartData.length === 0) {
        alert("Your cart is empty. Returning to store.");
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const step1Summary = document.getElementById('step1Summary');
    const step2Address = document.getElementById('step2Address');
    const step3Payment = document.getElementById('step3Payment');
    
    const step1Indicator = document.getElementById('step1Indicator');
    const step2Indicator = document.getElementById('step2Indicator');
    const step3Indicator = document.getElementById('step3Indicator');

    const checkoutItemsList = document.getElementById('checkoutItemsList');
    const checkoutTotalVal = document.getElementById('checkoutTotalVal');
    const finalDisplayTotal = document.getElementById('finalDisplayTotal');
    const mainCheckoutFlow = document.getElementById('mainCheckoutFlow');
    const successSection = document.getElementById('successSection');
    const successOrderId = document.getElementById('successOrderId');

    // Load Cart into Summary (Step 1)
    let total = 0;
    cartData.forEach(item => {
        total += item.price;
        checkoutItemsList.innerHTML += `
            <div class="summary-item" style="display:flex; justify-content:space-between; margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:1rem;">
                <span style="font-weight: 500;">${item.name}</span>
                <span>₹${item.price}</span>
            </div>
        `;
    });
    checkoutTotalVal.textContent = total;
    finalDisplayTotal.textContent = total;

    // --- State Management ---
    let orderDetails = {
        items: cartData,
        totalPrice: total,
        user: loggedUser,
        status: 'Pending Payment',
        date: new Date().toLocaleString()
    };

    // --- Step Transitions ---
    function updateStepUI(stepPos) {
        // Reset visual steps
        [step1Indicator, step2Indicator, step3Indicator].forEach(ind => {
            ind.style.background = '#eee';
            ind.style.color = '#888';
        });
        
        // Activate current and previous steps visually
        if(stepPos >= 1) { step1Indicator.style.background = 'var(--accent)'; step1Indicator.style.color = 'white'; }
        if(stepPos >= 2) { step2Indicator.style.background = 'var(--accent)'; step2Indicator.style.color = 'white'; }
        if(stepPos >= 3) { step3Indicator.style.background = 'var(--accent)'; step3Indicator.style.color = 'white'; }

        // Hide all sections
        step1Summary.style.display = 'none';
        step2Address.style.display = 'none';
        step3Payment.style.display = 'none';

        // Show active section
        if (stepPos === 1) step1Summary.style.display = 'block';
        if (stepPos === 2) step2Address.style.display = 'block';
        if (stepPos === 3) step3Payment.style.display = 'block';
    }

    // Step 1 -> Step 2
    document.getElementById('btnToStep2').addEventListener('click', () => {
        updateStepUI(2);
    });

    // Step 2 -> Step 1
    document.getElementById('btnBackToStep1').addEventListener('click', (e) => {
        e.preventDefault();
        updateStepUI(1);
    });

    // Step 2 -> Step 3
    const checkoutForm = document.getElementById('checkoutForm');
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Capture shipping details
        orderDetails.name = document.getElementById('chkName').value;
        orderDetails.mobile = document.getElementById('chkMobile').value;
        orderDetails.email = document.getElementById('chkEmail').value;
        orderDetails.address = document.getElementById('chkAddress').value;

        updateStepUI(3);
    });

    // Step 3 -> Step 2
    document.getElementById('btnBackToStep2').addEventListener('click', () => {
        updateStepUI(2);
    });

    // --- Razorpay Real Integration ---
    const initRazorpayBtn = document.getElementById('initRazorpayBtn');

    initRazorpayBtn.addEventListener('click', () => {
        // Fallback or Test UI setup
        initRazorpayBtn.textContent = 'Processing...';
        initRazorpayBtn.disabled = true;

        const options = {
            "key": "rzp_live_SiaJBrnBvBuE2Q", // Official Live API Key
            "amount": total * 100, // Amount in cents/paise
            "currency": "INR", // Dripzone uses INR internally now
            "name": "Dripzone",
            "description": "Thrift Drop Purchase",
            "image": "https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg",
            "handler": function (response) {
                // Finalize Order Document on Success
                orderDetails.orderId = 'RZP-' + Math.floor(Math.random() * 1000000000);
                orderDetails.status = 'Paid';
                orderDetails.paymentId = response.razorpay_payment_id;
                
                // Save to Admin DB
                let orders = JSON.parse(localStorage.getItem('dripzone_orders')) || [];
                orders.push(orderDetails);
                localStorage.setItem('dripzone_orders', JSON.stringify(orders));

                // Clear Cart
                localStorage.removeItem('dripzone_cart');

                // Transition to Success Screen
                mainCheckoutFlow.style.display = 'none';
                successOrderId.textContent = orderDetails.orderId;
                successSection.classList.add('active');
            },
            "prefill": {
                "name": orderDetails.name,
                "email": orderDetails.email || "test@example.com",
                "contact": orderDetails.mobile
            },
            "theme": {
                "color": "#111" // Dripzone dark theme accent
            }
        };

        try {
            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert("Payment Failed: " + response.error.description);
                initRazorpayBtn.textContent = 'Pay Now with Razorpay';
                initRazorpayBtn.disabled = false;
            });
            rzp1.open();
        } catch(e) {
            alert("Error initializing Razorpay. Ensure you are online and the key is valid.");
            console.error(e);
            initRazorpayBtn.textContent = 'Pay Now with Razorpay';
            initRazorpayBtn.disabled = false;
        }
    });

});
