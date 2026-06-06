import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [screen, setScreen] = useState("home");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [lastTransfer, setLastTransfer] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [recipients, setRecipients] = useState([]);  
  const [searchTerm, setSearchTerm] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientAccount, setNewRecipientAccount] = useState("");
  const [newRecipientBank, setNewRecipientBank] = useState("");
  const [adminStats, setAdminStats] = useState(null); 
  const [adminTransfers, setAdminTransfers] = useState([]);

useEffect(() => {
  const savedUser = localStorage.getItem("moeUser");

 if (savedUser) {
    const userData = JSON.parse(savedUser);

    setUser(userData);
    setScreen("home");

    const token = localStorage.getItem("token");

    fetch(
      "https://moe-transfer-backend-1.onrender.com/recipients",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecipients(
            data.map(r => ({
              initials: r.recipient_name.slice(0, 2).toUpperCase(),
              name: r.recipient_name,
              account: r.account_number,
              bank: r.bank_name
            }))
          );
        }
      });
}

  const params = new URLSearchParams(window.location.search);
  const payment = params.get("payment");

if (payment === "success") {
  const pendingTransfer = localStorage.getItem("pendingTransfer");

  if (pendingTransfer) {
    setLastTransfer(JSON.parse(pendingTransfer));
  }

  setScreen("delivered");
  window.history.replaceState({}, document.title, window.location.pathname);
}

if (payment === "cancel") {
  alert("Payment cancelled");
  setScreen("confirm");
  window.history.replaceState({}, document.title, window.location.pathname);
}

}, []);
  const rate = 1601;
  const converted = amount ? (Number(amount) * rate).toFixed(2) : "0.00";

  const signup = async (e) => {
    e.preventDefault();

    const res = await fetch("https://moe-transfer-backend-1.onrender.com/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Signup failed");
      return;
    }

    localStorage.setItem("token", data.token);
localStorage.setItem("moeUser", JSON.stringify(data.user));
setRecipients([]);
setUser(data.user);
  };

  const login = async (e) => {
    e.preventDefault();

    const res = await fetch("https://moe-transfer-backend-1.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

    localStorage.setItem("token", data.token);
localStorage.setItem("moeUser", JSON.stringify(data.user));

setUser(data.user);
  };

  const addRecipient = async () => {
    if (!newRecipientName || !newRecipientAccount || !newRecipientBank) {
      alert("Fill all recipient details");
      return;
    }

    const newRec = {
      initials: newRecipientName.slice(0, 2).toUpperCase(),
      name: newRecipientName.toUpperCase(),
      account: newRecipientAccount,
      bank: newRecipientBank,
    };
    const token = localStorage.getItem("token");

await fetch(
  "https://moe-transfer-backend-1.onrender.com/recipients",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      recipientName: newRecipientName,
      bankName: newRecipientBank,
      accountNumber: newRecipientAccount
    })
  }
);
    setRecipients([newRec, ...recipients]);
    setRecipient(newRec);
    setNewRecipientName("");
    setNewRecipientAccount("");
    setNewRecipientBank("");
    setScreen("confirm");
  };

  const saveTransfer = async () => {
    if (!paymentMethod) {
      alert("Choose payment method");
      return;
    }

    const transaction = {
      userEmail: user?.email,
      receiverName: recipient?.name,
      bankName: recipient?.bank,
      accountNumber: recipient?.account,
      country: "Nigeria",
      amount,
      received: converted,
      symbol: "₦",
      reference: `MT-${Date.now()}`,
      status:
        paymentMethod === "bank"
          ? "Waiting for Bank Transfer"
          : paymentMethod === "apple"
          ? "Paid by Apple Pay"
          : "Paid by Card",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };

    const res = await fetch("https://moe-transfer-backend-1.onrender.com/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });

    if (!res.ok) {
      alert("Transfer failed");
      return;
    }

   if (paymentMethod === "card" || paymentMethod === "apple") {

  const stripeRes = await fetch(
    "https://moe-transfer-backend-1.onrender.com/create-checkout-session",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(amount),
        recipient: recipient?.name,
      }),
    }
  );

  const stripeData = await stripeRes.json();

  if (stripeData.url) {
    localStorage.setItem("pendingTransfer", JSON.stringify(transaction));
    window.location.href = stripeData.url;
    return;
  }
}

setLastTransfer(transaction);
setScreen("processing");

setTimeout(() => {
  setScreen("delivered");
}, 3000);
  };

  const logout = () => {
  localStorage.removeItem("moeUser");
  localStorage.removeItem("token");
  localStorage.removeItem("pendingTransfer");
  setUser(null);
  setLastTransfer(null);
  setScreen("login");
};

  if (!user) {
    return (
      <div className="app">
        <div className="card">
          <h1 className="title">Moe Transfer</h1>
          <p className="subtitle">Fast EUR to NGN money transfer</p>

          <form onSubmit={authMode === "login" ? login : signup}>
            {authMode === "signup" && (
              <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            )}

            <input className="input" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

           
       <button className="yellow-btn" type="submit">
         {authMode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          <button className="link-btn" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
            {authMode === "login" ? "No account? Sign up" : "Already have account? Login"}
          </button>
        </div>
      </div>
    );
  }

  if (screen === "home") {
    return (
      <div className="app">
        <div className="card">
          <h1 className="title">Moe Transfer</h1>

          <div className="home-top">
            <div className="avatar">{user.name?.charAt(0)?.toUpperCase() || "M"}</div>
            <div className="reward">€15 🎁</div>
          </div>

          <div className="currency-row">
            <div className="currency-box">
              <div className="currency-label">🇩🇪 EUR</div>
              <input className="amount-box" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className="swap">↔</div>

            <div className="currency-box">
              <div className="currency-label">🇳🇬 NGN</div>
              <input className="amount-box" value={converted} readOnly />
            </div>
          </div>

          <div className="rate">€1.00 = NGN 1601.00 • No transfer fee</div>

          <button
            className="yellow-btn"
             onClick={() => {
              if (!amount || Number(amount) <= 0) {
                alert("Enter amount first");
                return;
              }
              setScreen("recipients");
            }}
          >
            SEND
          </button>

      <div className="bottom-nav">

<button className="nav-btn" onClick={() => setScreen("home")}>
  🏠 Home
</button>

<button className="nav-btn" onClick={() => setScreen("activity")}>
  ⇄ Activity
</button>

<button className="nav-btn" onClick={() => setScreen("home")}>
  🎁 Referrals
</button>

{user?.email?.toLowerCase() === "djmoe20@yahoo.com" && (
  <button
    className="nav-btn"
    onClick={() => setScreen("admin")}
  >
    👑 Admin
  </button>
)}

</div>

          <button className="gray-btn" onClick={logout}>Logout</button>
        </div>
      </div>
    );
  }

if (screen === "admin") {
  return (
    <div className="app">
      <div className="card">

        <button
          className="small-back"
          onClick={() => setScreen("home")}
        >
          ← Back
        </button>
        
        <h1 className="title">👑 Admin Dashboard</h1>

       <button
  className="yellow-btn"
  onClick={async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(
  "https://moe-transfer-backend-1.onrender.com/admin/stats",
  {
    headers: {
  Authorization: `Bearer ${token}`,
   },
  }
);

    const data = await res.json();
    setAdminStats(data);
  }}
>
  Load Admin Stats
</button>       

        <div className="recipient-item">
          <div>
            <div className="recipient-name">
              Total Users
            </div>
            <div className="recipient-bank">
             {adminStats?.users || "Click load"}
            </div>
          </div>
        </div>

        <div className="recipient-item">
          <div>
            <div className="recipient-name">
              Total Transfers
            </div>
            <div className="recipient-bank">
             {adminStats?.transfers || "Click load"}
            </div>
          </div>
        </div>

        <div className="recipient-item">
          <div>
            <div className="recipient-name">
              Transfer Volume
            </div>
            <div className="recipient-bank">
             {adminStats?.volume || 0}
            </div>
          </div>
        </div>
        
           <h3 style={{ color: "yellow", marginTop: "20px" }}>
  Recent Transfers
</h3>

<button
  className="yellow-btn"
  onClick={async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      "https://moe-transfer-backend-1.onrender.com/admin/transfers",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    setAdminTransfers(data.slice(0, 10));
  }}
>
  Load Transfers
</button>          
 {adminTransfers.map((t) => (
  <div className="recipient-item" key={t.id}>
    <div>
      <div className="recipient-name">
        #{t.id} - €{t.amount}
      </div>
      <div className="recipient-bank">
        {t.receiver_name} • {t.bank_name}
      </div>
      <div className="recipient-bank">
        {t.status} • {t.date}
      </div>
    </div>
  </div>
))}
        <button
          className="yellow-btn"
          onClick={() => setScreen("home")}
        >
          Back Home
        </button>

      </div>
    </div>
  );
}
if (screen === "activity") {
  return (
    <div className="app">
      <div className="card">
        <button className="small-back" onClick={() => setScreen("home")}>‹</button>
        <h1 className="title">Activity</h1>
       <input
  className="input"
  placeholder="Search by recipient name"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
        <button
          className="yellow-btn"
          onClick={async () => {
          const token = localStorage.getItem("token");

const res = await fetch(
  "https://moe-transfer-backend-1.onrender.com/transfers",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await res.json();

if (Array.isArray(data)) {
  setTransfers(data);
} else {
  setTransfers([]);
}
          }}
        >
          Load Transfer History
        </button>
   {Array.isArray(transfers) &&
transfers
.filter((t) =>
    (t.receiver_name || t.bank_name || t.recipientname || t.recipientName || t.receiverName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )
  .map((t) => (
 <div key={t.id} className="recipient-item" onClick={() => { setLastTransfer(t); setScreen("receipt"); }}>
    <div>
      <div className="recipient-name">
  {t.receiver_name || t.bank_name || t.recipientname || t.recipientName || t.receiverName || "Unknown Recipient"}
</div>

<div className="recipient-bank">
  {t.amount} {t.symbol} • {t.status}
</div>
    </div>
  </div>
))}
      </div>
    </div>
  );
}
  if (screen === "recipients") {
    return (
      <div className="app">
        <div className="card">
          <button className="small-back" onClick={() => setScreen("home")}>←</button>
          <h1 className="title">Choose recipient</h1>

          <input className="search-box" placeholder="Search by name or phone number" />

          <button className="yellow-btn" onClick={() => setScreen("addRecipient")}>＋ Add recipient</button>

          <h2 className="section-title">Saved Recipients</h2>

          {recipients.map((r, index) => (
            <div
              className="recipient-item"
              key={index}
              onClick={() => {
                setRecipient(r);
                setScreen("confirm");
              }}
            >
              <div className="recipient-avatar">{r.initials}</div>
              <div>
                <div className="recipient-name">{r.name}</div>
                <div className="recipient-bank">{r.account} ({r.bank})</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "addRecipient") {
    return (
      <div className="app">
        <div className="card">
          <button className="small-back" onClick={() => setScreen("recipients")}>←</button>
          <h1 className="title">Add recipient</h1>

          <input className="input" placeholder="Recipient name" value={newRecipientName} onChange={(e) => setNewRecipientName(e.target.value)} />
          <input className="input" placeholder="Account number" value={newRecipientAccount} onChange={(e) => setNewRecipientAccount(e.target.value)} />

          <select className="input" value={newRecipientBank} onChange={(e) => setNewRecipientBank(e.target.value)}>
            <option value="">Select Bank</option>
            <option value="Access Bank Nigeria">Access Bank Nigeria</option>
            <option value="Kuda Bank">Kuda Bank</option>
            <option value="Zenith Bank International">Zenith Bank International</option>
            <option value="Guaranty Trust Bank">Guaranty Trust Bank</option>
            <option value="Moniepoint Microfinance Bank">Moniepoint Microfinance Bank</option>
            <option value="Opay">Opay</option>
          </select>

          <button className="yellow-btn" onClick={addRecipient}>Save Recipient</button>
        </div>
      </div>
    );
  }

  if (screen === "confirm") {
    return (
      <div className="app">
        <div className="card">
          <button className="small-back" onClick={() => setScreen("recipients")}>←</button>
          <h1 className="title">Confirm Transfer</h1>

          <div className="summary-box">
            <div className="confirm-row"><span>Transfer amount</span><strong>€{amount}</strong></div>
            <div className="confirm-row"><span>Transfer fee</span><strong>€0.00</strong></div>
            <div className="confirm-row"><span>Total recipient gets</span><strong>NGN {converted}</strong></div>
            <p className="subtitle">Exchange rate €1.00 = ₦{rate}</p>
          </div>

          <div className="recipient-card">
            <div className="recipient-name">{recipient.name}</div>
            <div className="recipient-bank">{recipient.account} ({recipient.bank})</div>
          </div>

          <button className="yellow-btn" onClick={() => setScreen("payment")}>Continue to Payment</button>
        </div>
      </div>
    );
  }

  if (screen === "payment") {
    return (
      <div className="app">
        <div className="card">
          <button className="small-back" onClick={() => setScreen("confirm")}>←</button>
          <h1 className="title">Payment Method</h1>

          <div className="summary-box">
            <p className="subtitle">You send</p>
            <div className="summary-value">€{amount}</div>
            <p className="subtitle">Receiver gets</p>
            <div className="summary-value">₦{converted}</div>
          </div>

          <div className={`payment-card ${paymentMethod === "apple" ? "active" : ""}`} onClick={() => setPaymentMethod("apple")}>
            <div className="payment-title"> Apple Pay</div>
            <div className="payment-sub">Pay instantly with Apple Pay</div>
          </div>

          <div className={`payment-card ${paymentMethod === "card" ? "active" : ""}`} onClick={() => setPaymentMethod("card")}>
            <div className="payment-title">💳 Credit / Debit Card</div>
            <div className="payment-sub">Pay fast with Visa or Mastercard</div>
          </div>

          <div className={`payment-card ${paymentMethod === "bank" ? "active" : ""}`} onClick={() => setPaymentMethod("bank")}>
            <div className="payment-title">🏦 Bank Transfer</div>
            <div className="payment-sub">Send money from your bank account</div>
          </div>

          {paymentMethod === "bank" && (
            <div className="recipient-card">
              <div className="recipient-name">Moe Transfer Bank Details</div>
              <div className="recipient-bank">IBAN: DE00 0000 0000 0000 0000 00</div>
              <div className="recipient-bank">Name: Moe Transfer Ltd</div>
            </div>
          )}

          <button className="yellow-btn" onClick={saveTransfer}>
            {paymentMethod === "bank" ? "I Have Sent Bank Transfer" : paymentMethod === "card" ? "Pay with Card" : "Pay with Apple Pay"}
          </button>
        </div>
      </div>
    );
  }
if (screen === "processing") {
  return (
    <div className="app">
      <div className="card">

        <h1 className="success-title">
          Transfer Processing ⏳
        </h1>

        <div className="summary-box">

          <p className="summary-label">
            Recipient
          </p>

          <div className="summary-value">
            {lastTransfer.receiverName}
          </div>

          <p className="summary-label">
            Receiver gets
          </p>

          <div className="summary-value">
            {lastTransfer.symbol}
            {lastTransfer.received}
          </div>

          <p className="summary-label">
            Reference
          </p>

          <div className="reference">
            {lastTransfer.reference}
          </div>

        </div>

        <p style={{ textAlign: "center" }}>
          Please wait while we process your transfer...
        </p>

      </div>
    </div>
  );
}
if (screen === "delivered") {
  return (
    <div className="app">
      <div className="card">
        <h1 className="success-title">Transfer Successful ✅</h1>

        <p style={{ textAlign: "center", fontSize: "22px" }}>
          {lastTransfer?.receiverName || "Recipient"} has now received your transfer.
        </p>

        <div className="summary-box">
          <p className="summary-label">Receiver gets</p>
          <div className="summary-value">
            {lastTransfer?.symbol || "₦"}{lastTransfer?.received || "0.00"}
          </div>

          <p className="summary-label">Transfer ID</p>
          <div className="reference">{lastTransfer?.reference || "Payment successful"}</div>
        </div>

        <button className="yellow-btn" onClick={() => setScreen("receipt")}>
          View Receipt
        </button>

        <button className="gray-btn" onClick={() => setScreen("home")}>
          OK
        </button>
      </div>
    </div>
  );
}
    if (screen === "receipt") {
    return (
      <div className="app">
        <div className="card">
          <h1 className="success-title">Transfer Created ✅</h1>

          <div className="summary-box">
            <div className="recipient-name">{lastTransfer.receiverName}</div><p className="summary-label">Recipient</p>
            <div className="recipient-name">{lastTransfer.receiverName}</div>
            
            <p className="summary-label">Bank</p>
<div className="summary-value">{lastTransfer.bankName}</div>

<p className="summary-label">Account Number</p>
<div className="summary-value">{lastTransfer.accountNumber}</div>  
          
            <p className="summary-label">You sent</p>
            <div className="summary-value">€{lastTransfer.amount}</div>

            <p className="summary-label">Receiver gets</p>
            <div className="summary-value">{lastTransfer.symbol}{lastTransfer.received}</div>

            <p className="summary-label">Status</p>
            <div className="recipient-name">{lastTransfer.status}</div>

            <div className="reference">{lastTransfer.reference}</div><p className="summary-label">Reference</p>
            <div className="reference">{lastTransfer.reference}</div>
            
            <p className="summary-label">Date</p>
<div className="summary-value">{lastTransfer.date}</div>

<p className="summary-label">Time</p>
<div className="summary-value">{lastTransfer.time}</div>
          </div>

         <button
  className="yellow-btn"
  onClick={() => window.print()}
>
  📄 Download Receipt
</button>

<button
  className="yellow-btn"
  onClick={() => setScreen("home")}
>
  Send Again
</button>

<button
  className="gray-btn"
  onClick={logout}
>
  Logout
</button>
        </div>
      </div>
    );
  }
}

export default App;
