const ROOMS=["Gemini 1","Gemini 2","Royal 1","Royal 2","VIP Room"];
const ENTRY_CODES=["60608","60001"], STORE="tvm_guesthouse_v1";
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

 $("roomChoices").innerHTML=ROOMS.map((r,i)=>`<label class="roomchoice"><input type="checkbox" name="rooms" value="${esc(r)}"><span>${esc(r)}</span></label>`).join("");
 renderAll();
 $("cancelEdit").onclick=()=> $("editPanel").classList.add("hidden");
 $("editForm").onsubmit=saveEdit;
}
function switchTab(name){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));["main","entry"].forEach(id=>$(id).classList.toggle("hidden",id!==name));}
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
function renderCalendar(){
 const month=Number($("month").value),year=Number($("year").value),count=new Date(year,month+1,0).getDate();
 const table=(start,end)=> {
  let html=`<div class="period-title">${start===1?"Days 1–15":"Days 16–end of month"}</div><div class="gridwrap"><table class="date-calendar"><thead><tr><th class="date-head">Date</th>${ROOMS.map(room=>`<th class="room-column">${esc(room)}</th>`).join("")}</tr></thead><tbody>`;
  for(let day=start;day<=Math.min(end,count);day++){
   const date=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
   const weekday=new Date(year,month,day).toLocaleDateString("en-IN",{weekday:"short"});
   html+=`<tr><th class="date-label"><span class="date-number">${day}</span><span class="date-week">${weekday}</span></th>`;
   ROOMS.forEach(room=>{
    const booking=records.find(x=>x.status==="active"&&x.rooms.includes(room)&&x.checkin<=date&&date<x.checkout);
    const cls=booking?"booked":"vacant";
    const title=booking?`Booked: ${booking.guest_name}`:"Vacant";
    html+=`<td><button type="button" class="roombox ${cls}" title="${esc(title)}" aria-label="${esc(date)} ${esc(room)} ${esc(title)}" data-date="${date}" data-room="${esc(room)}"></button></td>`;
   });
   html+="</tr>";
  }
  html+="</tbody></table></div>";
  return html;
 };
 $("calendar").innerHTML=table(1,15)+table(16,31);
 $("calendar").querySelectorAll(".roombox").forEach(el=>el.onclick=()=>roomInfo(el.dataset.date,el.dataset.room));
}
function roomInfo(date,room){
 const b=records.find(x=>x.status==="active"&&x.rooms.includes(room)&&x.checkin<=date&&date<x.checkout);
 if(!b){toast(room+" is vacant on "+fmt(date));return}
 const code=prompt(b.guest_name+" · "+room+" · "+fmt(b.checkin)+" to "+fmt(b.checkout)+"\nEnter edit passcode to change dates:");
 if(code===null)return;
 if(!ENTRY_CODES.includes(code)){toast("Incorrect passcode");return}
 $("editBookingId").value=b.id;
 $("editGuest").textContent=b.guest_name+" — "+b.rooms.join(", ");
 $("editCheckin").value=b.checkin;
 $("editCheckout").value=b.checkout;
 $("editPanel").classList.remove("hidden");
 $("editPanel").scrollIntoView({behavior:"smooth",block:"center"});
}
function saveEdit(e){
 e.preventDefault();
 const b=records.find(x=>x.id===$("editBookingId").value&&x.status==="active");
 if(!b){toast("Booking not found");return}
 const checkin=$("editCheckin").value,checkout=$("editCheckout").value;
 if(!checkin||!checkout||checkout<=checkin){toast("Checkout date must be after check-in");return}
 const clashes=records.filter(x=>x.id!==b.id&&x.status==="active"&&x.checkin<checkout&&x.checkout>checkin&&x.rooms.some(r=>b.rooms.includes(r)));
 if(clashes.length){toast("Date change conflicts with another booking for one or more rooms");return}
 b.checkin=checkin;b.checkout=checkout;b.updated_at=new Date().toISOString();
 save();$("editPanel").classList.add("hidden");toast("Booking dates updated");
}
function renderAll(){renderCalendar()}
document.addEventListener("DOMContentLoaded",init);
