

// Backend API base URL (always points to Render since backend is deployed there)
const API_BASE = "https://book-my-ticket-hackathon.onrender.com";



let seatMap = {};

async function run() {
  const tbl = document.getElementById("tbl");
  tbl.innerHTML = "";
  const res = await fetch(`${API_BASE}/seats`);
  const resarray = await res.json();
  const j = resarray.sort((a, b) => a.id - b.id);
  let tr;
  for (let i = 0; i < j.length; i++) {
    if (i % 8 === 0) tr = document.createElement("tr");
    const td = document.createElement("td");
    td.id = `seat-${j[i].id}`;
    seatMap[j[i].id] = { td, name: j[i].name, isbooked: j[i].isbooked };
    const baseClasses =
      "w-32 h-32 rounded-2xl text-center align-middle text-2xl font-bold transition-all duration-300 select-none relative group";
    if (j[i].isbooked) {
      td.className = `${baseClasses} bg-rose-500/10 text-rose-500/60 border border-rose-500/20 cursor-not-allowed`;
      td.innerHTML = `
              <span class="relative z-10">${j[i].id}</span>
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-slate-900 border border-slate-700 text-sm text-slate-300 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-2xl z-50 pointer-events-none font-normal shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                  Booked by: <span class="font-bold text-white ml-1">${j[i].name}</span>
                  <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-slate-700"></div>
                  <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[5px] border-transparent border-t-slate-900"></div>
              </div>
          `;
    } else {
      td.className = `${baseClasses} bg-emerald-500 text-white border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:bg-emerald-400 hover:-translate-y-1.5 hover:shadow-[0_10px_25px_rgba(16,185,129,0.5)] active:scale-95 active:shadow-[0_0_10px_rgba(16,185,129,0.3)]`;
      td.innerHTML = `<span class="relative z-10">${j[i].id}</span>`;
    }
    td.addEventListener("click", async function (e) {
      const currentTd = e.currentTarget;
      if (currentTd.classList.contains("cursor-not-allowed")) {
        return;
      }
      try {
        const id = j[i].id;
        const name = prompt("Enter your name");
        if (!name) return;
        const res = await fetch(`${API_BASE}/book/legacy/${id}/${name}`, { method: "PUT" });
        const data = await res.json();
        if (data.error) {
          alert("FAILED! Couldn't book! already booked.");
        } else {
          alert("Booked successfully!");
          // UI will be updated after booking
        }
      } catch (ex) {
        alert("error booking " + ex);
      }
    });

    tr.appendChild(td);
    tbl.appendChild(tr);
  }
}

run();


