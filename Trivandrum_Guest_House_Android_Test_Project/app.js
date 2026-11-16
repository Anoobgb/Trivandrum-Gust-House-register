const ROOMS=["Gemini 1","Gemini 2","Royal 1","Royal 2","VIP Room"];
const ENTRY_CODES=["60608","60001"], EXPORT_CODE="1117", STORE="tvm_guesthouse_v1";
let records=JSON.parse(localStorage.getItem(STORE)||"[]");
const $=id=>document.getElementById(id);
const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=s=>s?new Date(s+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"";
function save(){localStorage.setItem(STORE,JSON.stringify(records));renderAll()}
function toast(msg){$("toast").textContent=msg;$("toast").style.display="block";setTimeout(()=>$("toast").style.display="none",2600)}
function init(){
 const now=new Date();const m=$("month"),y=$("year");
 ["January","February","March","April","May","June","July","August","September","October","November","December"].forEach((v,i)=>m.add(new Option(v,String(i))));
 m.value=String(now.getMonth());
 for(let n=now.getFullYear()-1;n<=now.getFullYear()+5;n++)y.add(new Option(n,n));
 y.value=String(now.getFullYear());
 m.onchange=renderCalendar;y.onchange=renderCalendar;
 document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
 $("verifyEntry").onclick=verifyEntry;
 $("designation").onchange=()=>{const emp=$("designation").value==="Employee";$("employeeWrap").classList.toggle("hidden",!emp);$("employeeNumber").required=emp;if(!emp)$("employeeNumber").value=""};
 $("entryForm").onsubmit=saveEntry;
 $("cancelEntry").onclick=()=>{ $("entryForm").reset();$("entryForm").classList.add("hidden");$("entryLock").classList.remove("hidden");switchTab("main")};
 $("exportCompleted").onclick=exportCompleted;
 $("roomChoices").innerHTML=ROOMS.map((r,i)=>`<label class="roomchoice"><input type="checkbox" name="rooms" value="${esc(r)}"><span>${esc(r)}</span></label>`).join("");
 processDue();renderAll();
 setInterval(()=>{processDue();renderAll()},30000);
}
function switchTab(name){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));["main","entry","completed"].forEach(id=>$(id).classList.toggle("hidden",id!==name));if(name==="completed")renderCompleted()}
function verifyEntry(){if(ENTRY_CODES.includes($("entryPass").value)){ $("entryLock").classList.add("hidden");$("entryForm").classList.remove("hidden");$("entryPass").value="";}else toast("Incorrect passcode")}
function saveEntry(e){
 e.preventDefault();const f=new FormData(e.target);const rooms=f.getAll("rooms");
 const b={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),guest_name:f.get("guest_name").trim(),occupants:Number(f.get("occupants")),designation:f.get("designation"),employee_number:f.get("employee_number")||"",rooms,checkin:f.get("checkin"),checkout:f.get("checkout"),status:"active",created_at:new Date().toISOString()};
 if(!rooms.length){toast("Select at least one room");return}
 if(b.checkout<=b.checkin){toast("Checkout date must be after check-in");return}
 const clashes=records.filter(x=>x.status==="active"&&x.checkin<b.checkout&&x.checkout>b.checkin&&x.rooms.some(r=>rooms.includes(r)));
 if(clashes.length&&!confirm("One or more selected rooms are already booked during these dates. Save anyway?"))return;
 records.push(b);save();e.target.reset();$("employeeWrap").classList.add("hidden");$("employeeNumber").required=false;$("entryForm").classList.add("hidden");$("entryLock").classList.remove("hidden");switchTab("main");toast("Booking saved and main register updated");
}
function processDue(){
 const now=new Date(),today=todayISO();
 if(now.getHours()<11)return;
 let changed=false;
 records.forEach(b=>{if(b.status==="active"&&b.checkout<=today){b.status="completed";b.completed_at=new Date().toISOString();changed=true}});
 if(changed)localStorage.setItem(STORE,JSON.stringify(records));
}
function renderCalendar(){
 const month=Number($("month").value),year=Number($("year").value),count=new Date(year,month+1,0).getDate();
 $("calendar").querySelector("thead").innerHTML=`<tr><th>Date / Day</th>${ROOMS.map(r=>`<th>${esc(r)}</th>`).join("")}</tr>`;
 let html="";
 for(let day=1;day<=count;day++){
  const date=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`,dow=new Date(year,month,day).toLocaleDateString("en-IN",{weekday:"short"});
  html+=`<tr><td>${String(day).padStart(2,"0")}<br><span class="small">${dow}</span></td>`;
  ROOMS.forEach(room=>{
   const b=records.find(x=>x.status==="active"&&x.rooms.includes(room)&&x.checkin<=date&&date<x.checkout);
   const due=records.find(x=>x.status==="active"&&x.rooms.includes(room)&&x.checkout===date);
   const cls=due?"checkout":b?"booked":"vacant";
   const title=due?`Checkout today: ${due.guest_name}`:b?`Booked: ${b.guest_name}`:"Vacant";
   html+=`<td><button class="roombox ${cls}" title="${esc(title)}" aria-label="${esc(room)} ${esc(title)}" data-date="${date}" data-room="${esc(room)}"></button></td>`;
  });
  html+="</tr>";
 }
 $("calendar").querySelector("tbody").innerHTML=html;
 $("calendar").querySelectorAll(".roombox").forEach(el=>el.onclick=()=>roomInfo(el.dataset.date,el.dataset.room));
}
function roomInfo(date,room){
 const b=records.find(x=>x.status==="active"&&x.rooms.includes(room)&&x.checkin<=date&&date<x.checkout)||records.find(x=>x.status==="active"&&x.rooms.includes(room)&&x.checkout===date);
 if(!b){toast(`${room} is vacant on ${fmt(date)}`);return}
 toast(`${b.guest_name} · ${room} · ${fmt(b.checkin)} to ${fmt(b.checkout)}${b.checkout===date?" · CHECKOUT TODAY":""}`);
}
function renderCompleted(){
 const arr=records.filter(x=>x.status==="completed").sort((a,b)=>a.checkout.localeCompare(b.checkout)||a.guest_name.localeCompare(b.guest_name));
 $("completedList").innerHTML=arr.length?arr.map(b=>`<article class="card"><strong>${esc(b.guest_name)}</strong><div class="meta">Designation: ${esc(b.designation)}${b.employee_number?` · Employee No: ${esc(b.employee_number)}`:""}<br>Occupants: ${b.occupants}<br>Check-in: ${fmt(b.checkin)}<br>Checkout: ${fmt(b.checkout)}<br>Rooms: ${esc(b.rooms.join(", "))}</div></article>`).join(""):`<div class="empty">No completed checkouts yet.</div>`;
}
function exportCompleted(){
 const code=prompt("Enter passcode to export completed records");
 if(code!==EXPORT_CODE){if(code!==null)toast("Incorrect export passcode");return}
 const arr=records.filter(x=>x.status==="completed").sort((a,b)=>a.checkout.localeCompare(b.checkout));
 if(!arr.length){toast("No completed records to export");return}
 if(!window.XLSX){toast("Excel library unavailable. Check internet connection.");return}
 const data=arr.map(b=>({"Guest Name":b.guest_name,"Designation":b.designation,"Employee Number":b.employee_number,"Occupants":b.occupants,"Rooms Booked":b.rooms.join(", "),"Check-in Date":b.checkin,"Checkout Date":b.checkout,"Completed At":b.completed_at||""}));
 const ws=XLSX.utils.json_to_sheet(data),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Completed Guests");XLSX.writeFile(wb,"Guest_House_Completed_Register.xlsx");
}
function renderAll(){renderCalendar();renderCompleted()}
document.addEventListener("DOMContentLoaded",init);
