const balance = document.getElementById('balance');
const moneyPlus = document.getElementById('income');
const moneyMinus = document.getElementById('expense');
const list = document.getElementById('transaction-list');
const form = document.getElementById('form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type'); // Ambil elemen select tipe
const transactionIdInput = document.getElementById('transaction-id');
const submitButton = form.querySelector('.btn[type="submit"]');
const cancelEditButton = document.getElementById('cancel-edit');

// Coba ambil transaksi dari local storage
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));

// Inisialisasi state transaksi
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];
let isEditing = false; // Flag untuk menandai mode edit

// --- FUNCTIONS ---

// Format Angka ke Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

// Tambah transaksi ke DOM list
function addTransactionDOM(transaction) {
    // Tentukan tanda + atau - berdasarkan tipe atau nilai
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');

    // Tambah kelas berdasarkan tanda (atau tipe)
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    item.innerHTML = `
        ${transaction.description}
        <span>${sign}${formatRupiah(Math.abs(transaction.amount))}</span>
        <div> <button class="edit-btn" onclick="editTransaction('${transaction.id}')">Ubah</button>
            <button class="delete-btn" onclick="removeTransaction('${transaction.id}')">Hapus</button>
        </div>
    `;
    list.appendChild(item);
}

// Update nilai saldo, pemasukan, dan pengeluaran
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0);
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0);
    const expense = (
        amounts
        .filter(item => item < 0)
        .reduce((acc, item) => (acc += item), 0) * -1 // Buat jadi positif untuk tampilan
    );

    balance.innerText = formatRupiah(total);
    moneyPlus.innerText = formatRupiah(income);
    moneyMinus.innerText = formatRupiah(expense);
}

// Hapus transaksi berdasarkan ID
function removeTransaction(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateLocalStorage();
        init(); // Re-initialize tampilan
    }
}

// Siapkan form untuk edit transaksi
function editTransaction(id) {
    const transaction = transactions.find(trx => trx.id === id);
    if (!transaction) return;

    isEditing = true;

    // Isi form dengan data transaksi yang akan diedit
    transactionIdInput.value = transaction.id;
    descriptionInput.value = transaction.description;
    // Tampilkan nilai asli (positif atau negatif) di input number
    amountInput.value = transaction.amount;
    // Setel tipe berdasarkan nilai amount
    typeSelect.value = transaction.amount >= 0 ? 'income' : 'expense';
    typeSelect.disabled = true; // Nonaktifkan pilihan tipe saat edit agar amount saja yg diubah tandanya

    // Ubah teks tombol submit dan tampilkan tombol batal
    submitButton.textContent = 'Simpan Perubahan';
    cancelEditButton.style.display = 'inline-block'; // Tampilkan tombol batal

    descriptionInput.focus(); // Fokus ke input deskripsi
}

// Fungsi untuk membatalkan mode edit
function cancelEdit() {
    isEditing = false;
    transactionIdInput.value = ''; // Kosongkan ID
    form.reset(); // Reset semua field form
    typeSelect.disabled = false; // Aktifkan kembali pilihan tipe
    submitButton.textContent = 'Tambah Transaksi'; // Kembalikan teks tombol
    cancelEditButton.style.display = 'none'; // Sembunyikan tombol batal
}

// Proses Tambah atau Ubah Transaksi (dari form submit)
function handleTransactionSubmit(e) {
    e.preventDefault(); // Mencegah reload halaman

    const description = descriptionInput.value.trim();
    let amount = +amountInput.value; // Konversi ke number
    const type = typeSelect.value;

    if (description === '' || amount === 0 || isNaN(amount)) {
        alert('Mohon isi deskripsi dan jumlah (jumlah tidak boleh 0).');
        return;
    }

    // Sesuaikan tanda amount berdasarkan tipe yang dipilih (jika bukan mode edit)
    if (!isEditing) {
        if (type === 'expense' && amount > 0) {
            amount *= -1; // Jadikan negatif jika tipe expense dan amount positif
        } else if (type === 'income' && amount < 0) {
            amount *= -1; // Jadikan positif jika tipe income dan amount negatif
        }
    }
    // Jika mode edit, tanda amount sudah benar dari input

    if (isEditing) {
        // --- Proses Update ---
        const transactionId = transactionIdInput.value;
        transactions = transactions.map(trx =>
            trx.id === transactionId ? { ...trx, description: description, amount: amount } : trx
        );
        cancelEdit(); // Keluar dari mode edit setelah simpan
    } else {
        // --- Proses Tambah Baru ---
        const newTransaction = {
            id: generateID(), // Buat ID unik
            description: description,
            amount: amount
        };
        transactions.push(newTransaction);
        form.reset(); // Reset form setelah tambah
    }

    updateLocalStorage();
    init(); // Re-initialize tampilan
}


// Generate ID unik sederhana (untuk contoh)
function generateID() {
    // Cara sederhana, mungkin tidak 100% unik di kasus ekstrim,
    // tapi cukup untuk aplikasi sederhana ini
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Update transaksi di local storage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Inisialisasi aplikasi
function init() {
    list.innerHTML = ''; // Kosongkan list sebelum mengisi ulang
    if (transactions.length === 0) {
         // Jika tidak ada transaksi, tampilkan pesan
         const emptyMessage = document.createElement('li');
         emptyMessage.style.textAlign = 'center';
         emptyMessage.style.boxShadow = 'none';
         emptyMessage.style.border = 'none';
         emptyMessage.textContent = 'Belum ada transaksi.';
         list.appendChild(emptyMessage);
    } else {
        // Urutkan transaksi berdasarkan waktu pembuatan (ID mengandung timestamp)
        // Asumsi ID selalu dimulai dengan '_' diikuti random lalu timestamp
        transactions.sort((a, b) => {
            const timeA = parseInt(a.id.split('_')[2], 36) || 0; // Ambil bagian timestamp dari ID
            const timeB = parseInt(b.id.split('_')[2], 36) || 0;
            return timeA - timeB; // Urutkan dari yang terlama ke terbaru
        });
        transactions.forEach(addTransactionDOM);
    }
    updateValues(); // Update ringkasan
}

// --- EVENT LISTENERS ---
form.addEventListener('submit', handleTransactionSubmit);
cancelEditButton.addEventListener('click', cancelEdit);
// Listener untuk input amount agar tipe otomatis terpilih (opsional)
amountInput.addEventListener('input', () => {
    if (!isEditing) { // Hanya jika tidak sedang edit
        const amountValue = +amountInput.value;
        if (amountValue < 0) {
            typeSelect.value = 'expense';
        } else if (amountValue > 0) {
            typeSelect.value = 'income';
        }
    }
});

// --- INITIALIZE ---
init();
