const addBtn = document.querySelector< HTMLButtonElement>("#addDocBtn");
const formBox = document.querySelector< HTMLDivElement>("#addDocForm");
const overlay = document.querySelector<HTMLDivElement>("#overlay");
const form = document.querySelector<HTMLFormElement>("#docForm");
const docNameInput = document.querySelector< HTMLInputElement>("#docName");
const tableBody = document.querySelector< HTMLTableSectionElement>("#docTableBody");
const search = document.querySelector<HTMLInputElement>("#search");
const pendingWrapper = document.querySelector<HTMLDivElement>("#pendingCountWrapper");
const pendingCountInput = document.querySelector<HTMLInputElement>("#pendingCount");


const userBtn = document.querySelector<HTMLButtonElement>("user-btn");
const userMenu = document.querySelector< HTMLDivElement>("user-dropdown-menu");
const logoutBtn = document.querySelector< HTMLButtonElement>("logout-btn");

let editingId : number | null = null; 

if(!addBtn || !formBox || !overlay || !form || !docNameInput || !tableBody || !search || !pendingWrapper || !pendingCountInput || !userBtn || !userMenu || !logoutBtn) {
  throw new Error("One or more required elements are missing in the DOM.");
}

document.addEventListener("DOMContentLoaded", () => {
  const statusRadios = document.querySelectorAll<HTMLInputElement>('input[name="status"]');
  statusRadios.forEach((radio) => {
    radio.addEventListener("change", (e:Event) => {
      const target = e.target as HTMLInputElement;
      pendingWrapper.style.display = target.value === "pending" ? "block" : "none";
      if (target.value !== "pending") pendingCountInput.value = "";
    });
  });
  renderDocs();
});


addBtn.addEventListener("click", (e:MouseEvent) => {
  editingId = null;
  form.reset();
  pendingWrapper.style.display = "none"; 
  
  const submitBtn = document.querySelector('.submit') as HTMLButtonElement;
  if(!submitBtn)return;
  submitBtn.innerText = "Create Document";

  const header = document.querySelector<HTMLHeadingElement>('.form-header h2');
  if(!header)return;
  header.innerText = "Add New Document";
  formBox.classList.add("active");
  overlay.classList.add("active");
});

overlay.addEventListener("click", closeModal);

function closeModal() {
  formBox?.classList.remove("active");
  overlay?.classList.remove("active");
  editingId = null;
  form?.reset();
}


function toggleMenu(event: MouseEvent, id : number) {
  event.stopPropagation();
  const menu = document.getElementById(`menu-${id}`) as HTMLDivElement | null;
  
  document.querySelectorAll<HTMLDivElement>('.dropdown-menu').forEach(m => {
    if(m.id !== `menu-${id}`) m.classList.remove('show');
  });

  if (menu) {
    menu.classList.toggle('show');

    const rect = menu.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      menu.style.top = "auto";
      menu.style.bottom = "100%";
    } else {
      menu.style.top = "30px";
      menu.style.bottom = "auto";
    }
  }
}

window.onclick = (e:MouseEvent) => {
  document.querySelectorAll<HTMLDivElement>('.dropdown-menu').forEach(m => m.classList.remove('show'));
};



interface Doc {
  id: number;
  name: string;
  status: "needs-signing" | "pending" | "completed";
  pendingCount: number | null;
  date: string;
  time: string;
}

function deleteDoc(id : number):void {
  if (confirm("Are you sure?")) {
    const storedDocs = localStorage.getItem("documents");
    let docs: Doc[] = storedDocs ? JSON.parse(storedDocs):[];
    docs = docs.filter((d:Doc) => d.id !== id);
    localStorage.setItem("documents", JSON.stringify(docs));
    
    renderDocs();
  }
}

function editDoc(id: number): void {
  const storedDocs = localStorage.getItem("documents");
  const docs: Doc[] = storedDocs ? JSON.parse(storedDocs) : [];

  const doc = docs.find((d: Doc) => d.id === id);
  if (!doc) return;

  editingId = id;
  if(!docNameInput) return;
  docNameInput.value = doc.name;

  const radio = document.querySelector<HTMLInputElement>(
    `input[name="status"][value="${doc.status}"]`
  );
  if (radio) {
    radio.checked = true;
  }
  if (doc.status === "pending") {
    if(!pendingWrapper) return;
    pendingWrapper.style.display = "block";
    if(!pendingCountInput) return;
    pendingCountInput.value = String(doc.pendingCount ?? 0);
  } else {
    if(!pendingWrapper) return;
    pendingWrapper.style.display = "none";
    if(pendingCountInput)
    pendingCountInput.value = "";
  }

  const submit = document.querySelector<HTMLButtonElement>(".submit");
  if (submit) {
    submit.innerText = "Update Document";
  }
  const header = document.querySelector<HTMLHeadingElement>(".form-header h2");
  if (header) {
    header.innerText = "Edit Document";
  }

  formBox?.classList.add("active");
  overlay?.classList.add("active");
}

form.addEventListener("submit", (e: Event): void => {
  e.preventDefault();

  const docName = docNameInput.value.trim();

  const statusElement = document.querySelector<HTMLInputElement>(
    'input[name="status"]:checked'
  );

  if (!docName || !statusElement) {
    alert("Please fill in all fields.");
    return;
  }

const status = statusElement.value as Doc["status"];


  if (status === "pending" && !pendingCountInput.value) {
    alert("Please enter number of people");
    return;
  }

  const storedDocs = localStorage.getItem("documents");
  let docs: Doc[] = storedDocs ? JSON.parse(storedDocs) : [];

  if (editingId !== null) {
    docs = docs.map((d: Doc) =>
      d.id === editingId
        ? {
            ...d,
            name: docName,
            status: status,
            pendingCount:
              status === "pending"
                ? Number(pendingCountInput.value)
                : null,
          }
        : d
    );
  } else {
    const newDoc: Doc = {
      id: Date.now(),
      name: docName,
      status: status,
      pendingCount:
        status === "pending"
          ? Number(pendingCountInput.value)
          : null,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    docs.unshift(newDoc);
  }

  localStorage.setItem("documents", JSON.stringify(docs));

  renderDocs();
  closeModal();
});

function renderDocs(docsToRender:Doc[] | null = null) {
  const docs: Doc[] =
  docsToRender !== null
    ? docsToRender
    : JSON.parse(localStorage.getItem("documents") || "[]");

    if(!tableBody) return;
  tableBody.innerHTML = "";

  if (docs.length === 0) {
    const message = search?.value ? `No results for "${search.value}"` : "No documents found";
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: #64748b;">${message}</td></tr>`;
    return;
  }

  docs.forEach((doc: Doc):void => {
    const row = document.createElement("tr");
    const status = doc.status;
    
    let statusContent = status === "pending"
        ? `<span class="status-badge status-pending">Pending</span>
           <div class="waiting-text">
             Waiting for 
             <div class="people">
               ${doc.pendingCount ?? 0}
               ${doc.pendingCount === 1 ? "person" : "people"}
             </div>
           </div>`
        : `<span class="status-badge ${getStatusClass(status)}">
            ${formatStatus(status)}
           </span>`;

    row.innerHTML = `
      <td>
        <div class="doc-name">
          <input type="checkbox" />
          <span>${doc.name || "Untitled"}</span>
        </div>
      </td>

      <td>
        <div class="status-container">
          ${statusContent}
        </div>
      </td>

      <td class="last-modified">
        ${doc.date}<br />
        ${doc.time}
      </td>

      <td>
        <div class="doc-action">
          <button class="btn">
            ${getActionText(status)}
          </button>

          <div class="menu-wrapper">
            <i class="ri-more-2-fill more-icon"
               onclick="toggleMenu(event, ${doc.id})">
            </i>

            <div class="dropdown-menu" id="menu-${doc.id}">
              <div class="menu-item-action"
                   onclick="editDoc(${doc.id})">
                Edit
              </div>

              <div class="menu-item-action delete"
                   onclick="deleteDoc(${doc.id})">
                Delete
              </div>
            </div>

          </div>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });
}


function getStatusClass(s:Doc["status"]) :string { 
  if (!s) return "";
  const classes = { "needs-signing": "status-needs-signing", "pending": "status-pending", "completed": "status-completed" };
  return classes[s] || ""; 
}

function formatStatus(s:Doc["status"]):string { 
  if (!s) return "Unknown";
  return s.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()); 
}

function getActionText(s:Doc["status"]):string { 
  if (!s) return "View";
  const actions = { "needs-signing": "Sign now", "pending": "Preview", "completed": "Download PDF" };
  return actions[s] || "View"; 
}

search.addEventListener("input", ():void => {
  const query = search.value.trim().toLowerCase();
  const storedDocs = localStorage.getItem("documents");
  const docs: Doc[] = storedDocs?JSON.parse(storedDocs):[];
  if (!query) {
    renderDocs();
    return;
  }
  const filteredDocs = docs.filter(doc =>
    doc.name.toLowerCase().includes(query)
  );

  renderDocs(filteredDocs);
});

// localStorage.clear();


userBtn.addEventListener("click", (e) => {
  
  e.stopPropagation(); 
  userMenu.classList.toggle("active");
});


window.addEventListener("click", () => {
  if (userMenu.classList.contains("active")) {
    userMenu.classList.remove("active");
  }
});

// console.log("hiii");
