const API = 'http://localhost:3000';
const toppingsMaster = ['Cheese','Patty','Lettuce','Tomato','Onion','Mayonnaise','Mustard','Jalapeno'];

// Elements
const toppingsList = document.getElementById('toppingsList');
const burgerListEl = document.getElementById('burgerList');
const cartListEl = document.getElementById('cartList');
const preview = document.getElementById('preview');
const addBtn = document.getElementById('addBtn');
const updateBtn = document.getElementById('updateBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const basePriceInput = document.getElementById('basePrice');
const burgerNameInput = document.getElementById('burgerName');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const orderSummary = document.getElementById('orderSummary');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const closeModal = document.getElementById('closeModal');
const custName = document.getElementById('custName');
const custPhone = document.getElementById('custPhone');
const custAddress = document.getElementById('custAddress');

let selectedToppings = new Set();
let editingId = null;
let cart = [];

// init toppings UI
function initToppings(){
    toppingsMaster.forEach(t => {
        const el = document.createElement('button');
        el.className = 'topping-item';
        el.textContent = t;
        el.onclick = () => {
            if (selectedToppings.has(t)){ selectedToppings.delete(t); el.classList.remove('selected'); }
            else { selectedToppings.add(t); el.classList.add('selected'); }
            renderPreview();
        };
        toppingsList.appendChild(el);
    });
}

function renderPreview(){
    const name = burgerNameInput.value || 'Custom Burger';
    const toppings = Array.from(selectedToppings);
    const price = parseFloat(basePriceInput.value) + toppings.length * 0.5;
    preview.innerHTML = `<strong>${name}</strong><br/>Toppings: ${toppings.join(', ') || 'None'}<br/>Price: $${price.toFixed(2)}`;
}

// fetch & render menu
async function loadMenu(){
    const res = await fetch(API + '/burgers');
    const data = await res.json();
    burgerListEl.innerHTML = '';
    data.forEach(b => {
        const li = document.createElement('li');
        const left = document.createElement('div');
        left.innerHTML = `<strong>${b.name}</strong><br/><small>$${b.price.toFixed(2)} · ${b.toppings.join(', ')}</small>`;
        const right = document.createElement('div');
        const viewBtn = document.createElement('button'); viewBtn.textContent='View'; viewBtn.className='btn ghost'; viewBtn.onclick = ()=> viewBurger(b.id);
        const editBtn = document.createElement('button'); editBtn.textContent='Edit'; editBtn.className='btn ghost'; editBtn.onclick = ()=> startEdit(b.id);
        const delBtn = document.createElement('button'); delBtn.textContent='Delete'; delBtn.className='btn ghost'; delBtn.onclick = ()=> deleteBurger(b.id);
        const addToCartBtn = document.createElement('button'); addToCartBtn.textContent='Add to Cart'; addToCartBtn.className='btn'; addToCartBtn.onclick = ()=> addToCart(b);
        right.appendChild(viewBtn); right.appendChild(editBtn); right.appendChild(delBtn); right.appendChild(addToCartBtn);
        li.appendChild(left); li.appendChild(right);
        burgerListEl.appendChild(li);
    });
}

async function viewBurger(id){
    const res = await fetch(API + '/burgers/' + id);
    if (!res.ok) return alert('Not found');
    const b = await res.json();
    alert(`Name: ${b.name}\nPrice: $${b.price}\nToppings: ${b.toppings.join(', ') || 'None'}`);
}

function startEdit(id){
    fetch(API + '/burgers/' + id).then(r=>r.json()).then(b=>{
        editingId = id;
        burgerNameInput.value = b.name;
        basePriceInput.value = b.price;
        selectedToppings = new Set(b.toppings || []);
        // update toppings UI selection
        document.querySelectorAll('.topping-item').forEach(el=> el.classList.toggle('selected', selectedToppings.has(el.textContent)));
        addBtn.classList.add('hidden'); updateBtn.classList.remove('hidden'); cancelEditBtn.classList.remove('hidden');
        renderPreview();
    });
}

cancelEditBtn.onclick = ()=>{
    editingId = null;
    burgerNameInput.value='';
    basePriceInput.value = 3;
    selectedToppings.clear();
    document.querySelectorAll('.topping-item').forEach(el=> el.classList.remove('selected'));
    addBtn.classList.remove('hidden'); updateBtn.classList.add('hidden'); cancelEditBtn.classList.add('hidden');
    renderPreview();
}

async function deleteBurger(id){
    if (!confirm('Delete this burger?')) return;
    await fetch(API + '/burgers/' + id, {method:'DELETE'});
    await loadMenu();
}

async function addBurger(){
    const name = burgerNameInput.value || 'Custom Burger';
    const price = parseFloat(basePriceInput.value) + selectedToppings.size * 0.5;
    const toppings = Array.from(selectedToppings);
    await fetch(API + '/burgers', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, price, toppings})});
    burgerNameInput.value=''; basePriceInput.value=3; selectedToppings.clear();
    document.querySelectorAll('.topping-item').forEach(el=> el.classList.remove('selected'));
    renderPreview(); loadMenu();
}

async function updateBurger(){
    if (!editingId) return;
    const name = burgerNameInput.value || 'Custom Burger';
    const price = parseFloat(basePriceInput.value) + selectedToppings.size * 0.5;
    const toppings = Array.from(selectedToppings);
    await fetch(API + '/burgers/' + editingId, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, price, toppings})});
    cancelEditBtn.onclick(); loadMenu();
}

addBtn.onclick = addBurger;
updateBtn.onclick = updateBurger;
basePriceInput.oninput = renderPreview;
burgerNameInput.oninput = renderPreview;

// Cart functions
function addToCart(burger){
    const item = {id: burger.id, name: burger.name, price: burger.price, toppings: burger.toppings};
    cart.push(item);
    renderCart();
}

function renderCart(){
    cartListEl.innerHTML='';
    let total = 0;
    cart.forEach((c, idx)=>{
        const li = document.createElement('li');
        li.innerHTML = `<div><strong>${c.name}</strong><br/><small>$${c.price.toFixed(2)} · ${c.toppings.join(', ')}</small></div>`;
        const rem = document.createElement('button'); rem.textContent='Remove'; rem.className='btn ghost'; rem.onclick = ()=> { cart.splice(idx,1); renderCart(); };
        li.appendChild(rem);
        cartListEl.appendChild(li);
        total += c.price;
    });
    totalEl.textContent = total.toFixed(2);
}

checkoutBtn.onclick = ()=>{
    if (cart.length===0) return alert('Cart empty');
    // populate summary
    orderSummary.innerHTML = cart.map(c=> `<div>${c.name} - $${c.price.toFixed(2)}</div>`).join('');
    checkoutModal.classList.remove('hidden');
};

closeModal.onclick = ()=> checkoutModal.classList.add('hidden');

placeOrderBtn.onclick = async ()=>{
    const customer = {name: custName.value, phone: custPhone.value, address: custAddress.value};
    if (!customer.name || !customer.phone || !customer.address) return alert('Please fill details');
    const total = cart.reduce((s,i)=>s+i.price,0);
    const res = await fetch(API + '/orders',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({items:cart, total, customer})});
    const data = await res.json();
    alert('Order placed! Order ID: ' + data.id);
    cart = []; renderCart(); checkoutModal.classList.add('hidden');
    custName.value=''; custPhone.value=''; custAddress.value='';
};

async function init(){
    initToppings();
    renderPreview();
    await loadMenu();
}

init();
