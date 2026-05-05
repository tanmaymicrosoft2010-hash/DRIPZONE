document.addEventListener('DOMContentLoaded', () => {
    // Admin Guard (Robust Check)
    const loggedUser = localStorage.getItem('dripzone_user');
    const ADMIN_EMAILS = ['admin', 'admin@dripzone.com', 'tanmaymicroft2010@gmail.com', 'tanmaymicrosoft2010@gmail.com', 'chainpur345@gmail.com'];
    if (!ADMIN_EMAILS.includes(loggedUser)) {
        alert('Unauthorized access. Redirecting securely...');
        window.location.href = 'index.html';
        return;
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('dripzone_user');
        window.location.href = 'index.html';
    });

    const ordersTableBody = document.getElementById('ordersTableBody');
    const totalOrdersCount = document.getElementById('totalOrdersCount');
    const totalRevenueCount = document.getElementById('totalRevenueCount');

    const orders = JSON.parse(localStorage.getItem('dripzone_orders')) || [];
    totalOrdersCount.textContent = orders.length;
    
    // Calculate Total Revenue
    let totalRev = 0;
    orders.forEach(o => {
        // Only count if it's not a generic processing status (assuming realistic status states)
        totalRev += o.totalPrice || 0;
    });
    totalRevenueCount.textContent = '₹' + totalRev.toLocaleString();

    if (orders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem;">No orders found.</td></tr>';
        return;
    }

    orders.reverse().forEach(order => {
        // Format Items list
        const itemsHtml = order.items.map(i => `${i.name} (₹${i.price})`).join('<br>');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold;">${order.orderId}</td>
            <td>${order.date}</td>
            <td>${order.name}<br><small>(${order.user})</small></td>
            <td>${order.mobile}<br><small>${order.email || 'N/A'}</small></td>
            <td style="max-width: 250px;">${order.address}</td>
            <td class="item-list">${itemsHtml}</td>
            <td style="font-weight:bold; color:green;">₹${order.totalPrice}</td>
            <td><span class="status-badge">${order.status}</span></td>
        `;
        ordersTableBody.appendChild(tr);
    });

});
