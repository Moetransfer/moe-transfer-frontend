import React, { useState } from "react";
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

  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientAccount, setNewRecipientAccount] = useState("");
  const [newRecipientBank, setNewRecipientBank] = useState("");

  const rate = 1601;
  const converted = amount ? (Number(amount) * rate).toFixed(2) : "0.00";

  const [recipients, setRecipients] = useState([
    { initials: "MT", name: "MOCHI TINA", account: "2023128365", bank: "Kuda Bank" },
    { initials: "AK", name: "ABDULLAHI KABIRU", account: "9131574804", bank: "Moniepoint Microfinance Bank" },
    { initials: "TM", name: "TINA MOCHI", account: "0088497816", bank: "Access Bank Nigeria" },
    { initials: "EM", name: "EMMANUEL MOCHI", account: "4235229076", bank: "Zenith Bank International" },
  ]);

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

    setUser(data.user);
  };

  const addRecipient = () => {
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

    setLastTransfer(transaction);
    setScreen("receipt");
  };

  const logout = () => {
    setUser(null);
    setScreen("home");
    setAmount("");
    setRecipient(null);
    setPaymentMethod("");
    setLastTransfer(null);
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
              🏠 Home
</button>

<button className="nav-btn">
  ⇄ Activity
</button><button className="nav-btn" onClick={() => setScreen("home")}>
  🏠 Home
</button>

<button className="nav-btn" onClick={() => setShowHistory(true)}>
  ⇄ Activity
</button>>
            <button className="nav-btn">🎁 Referrals</button>
          </div>

          <button className="gray-btn" onClick={logout}>Logout</button>
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

  if (screen === "receipt") {
    return (
      <div className="app">
        <div className="card">
          <h1 className="success-title">Transfer Created ✅</h1>

          <div className="summary-box">
            <p className="summary-label">Recipient</p>
            <div className="recipient-name">{lastTransfer.receiverName}</div>

            <p className="summary-label">You sent</p>
            <div className="summary-value">€{lastTransfer.amount}</div>

            <p className="summary-label">Receiver gets</p>
            <div className="summary-value">{lastTransfer.symbol}{lastTransfer.received}</div>

            <p className="summary-label">Status</p>
            <div className="recipient-name">{lastTransfer.status}</div>

            <p className="summary-label">Reference</p>
            <div className="reference">{lastTransfer.reference}</div>
          </div>

          <button className="yellow-btn" onClick={() => setScreen("home")}>Send Again</button>
          <button className="gray-btn" onClick={logout}>Logout</button>
        </div>
      </div>
    );
  }
}

export default App;
