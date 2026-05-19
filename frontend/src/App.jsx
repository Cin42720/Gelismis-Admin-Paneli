import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Building2,
  Check,
  Database,
  FileText,
  FileUp,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogIn,
  LogOut,
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  School,
  Shield,
  SlidersHorizontal,
  Trash2,
  Upload,
  X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const fallbackGroups = [
  { id: 1, code: "supervisor", name: "Süpervizör" },
  { id: 2, code: "student", name: "Öğrenci" },
  { id: 3, code: "school", name: "Okul" },
  { id: 4, code: "company", name: "İşletme" }
];

const fallbackScreens = [
  { id: 1, code: "dashboard", title: "Gösterge Paneli", route: "/dashboard" },
  { id: 2, code: "student-list", title: "Öğrenci Listesi", route: "/students" },
  { id: 3, code: "school-list", title: "Okul Listesi", route: "/schools" },
  { id: 4, code: "company-list", title: "İşletme Listesi", route: "/companies" },
  { id: 5, code: "file-center", title: "Dosya Merkezi", route: "/files" },
  { id: 6, code: "ai-lab", title: "Yapay Zeka Analizi", route: "/ai" },
  { id: 7, code: "logs", title: "Loglar", route: "/logs" }
];

const navItems = [
  { id: "dashboard", label: "Panel", icon: LayoutDashboard },
  { id: "permissions", label: "Yetkiler", icon: Shield },
  { id: "records", label: "Kayıtlar", icon: Database },
  { id: "files", label: "Dosyalar", icon: FileUp },
  { id: "ai", label: "Yapay Zeka", icon: Bot },
  { id: "logs", label: "Loglar", icon: ListChecks }
];

const groupLabels = {
  supervisor: "Süpervizör",
  student: "Öğrenci",
  school: "Okul",
  company: "İşletme"
};

const demoLoginUsers = [
  {
    label: "Süpervizör",
    email: "supervisor@example.com",
    password: "123456",
    group_code: "supervisor"
  },
  {
    label: "Öğrenci",
    email: "ogrenci@example.com",
    password: "123456",
    group_code: "student"
  },
  {
    label: "Okul",
    email: "okul@example.com",
    password: "123456",
    group_code: "school"
  },
  {
    label: "İşletme",
    email: "isletme@example.com",
    password: "123456",
    group_code: "company"
  }
];

const screenLabels = {
  dashboard: "Gösterge Paneli",
  "student-list": "Öğrenci Listesi",
  "school-list": "Okul Listesi",
  "company-list": "İşletme Listesi",
  "file-center": "Dosya Merkezi",
  "ai-lab": "Yapay Zeka Analizi",
  logs: "Loglar"
};

const groupIcons = {
  supervisor: Shield,
  student: GraduationCap,
  school: School,
  company: Building2
};

const permissionFields = [
  ["can_create", "Ekle"],
  ["can_read", "Oku"],
  ["can_update", "Güncelle"],
  ["can_delete", "Sil"],
  ["can_upload", "Dosya"]
];

const defaultPermissionDraft = {
  can_create: false,
  can_read: true,
  can_update: false,
  can_delete: false,
  can_upload: false,
  allowed_extensions: "txt,png,jpg,jpeg,pdf,doc,docx,xls,xlsx"
};

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage.getItem("final_admin_user"));
    } catch {
      return null;
    }
  });
  const [loginEmail, setLoginEmail] = useState("supervisor@example.com");
  const [loginPassword, setLoginPassword] = useState("123456");
  const [loginLoading, setLoginLoading] = useState(false);
  const [groups, setGroups] = useState(fallbackGroups);
  const [screens, setScreens] = useState(fallbackScreens);
  const [permissions, setPermissions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(1);
  const [selectedScreenId, setSelectedScreenId] = useState(1);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [records, setRecords] = useState([]);
  const [logs, setLogs] = useState([]);
  const [files, setFiles] = useState([]);
  const [capabilities, setCapabilities] = useState(null);
  const [recordTitle, setRecordTitle] = useState("Demo kayıt");
  const [recordJson, setRecordJson] = useState('{\n  "not": "JSON veri örneği",\n  "durum": "aktif"\n}');
  const [editingRecordId, setEditingRecordId] = useState("");
  const [draft, setDraft] = useState(defaultPermissionDraft);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [analyzingFileId, setAnalyzingFileId] = useState("");
  const [prompt, setPrompt] = useState("Bu panelin yetki ve dosya akışlarını kısa özetle.");
  const [promptResult, setPromptResult] = useState(null);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === Number(selectedGroupId)) || groups[0],
    [groups, selectedGroupId]
  );

  const selectedScreen = useMemo(
    () => screens.find((screen) => screen.id === Number(selectedScreenId)) || screens[0],
    [screens, selectedScreenId]
  );

  const currentPermission = useMemo(() => {
    if (!selectedGroup || !selectedScreen) return null;
    return permissions.find(
      (permission) =>
        permission.group_code === selectedGroup.code &&
        permission.screen_code === selectedScreen.code
    );
  }, [permissions, selectedGroup, selectedScreen]);

  const groupPermissions = useMemo(() => {
    if (!selectedGroup) return [];
    const rows = permissions.filter((permission) => permission.group_code === selectedGroup.code);
    return rows.length ? rows : fallbackPermissionRows(selectedGroup, screens);
  }, [permissions, screens, selectedGroup]);

  const currentGroupCode = currentUser?.group_code;
  const isSupervisor = currentGroupCode === "supervisor";

  const visibleGroups = useMemo(() => {
    if (!currentUser || isSupervisor) return groups;
    return groups.filter((group) => group.code === currentGroupCode);
  }, [currentGroupCode, currentUser, groups, isSupervisor]);

  const visibleNavItems = useMemo(() => {
    if (isSupervisor) return navItems;
    return navItems.filter((item) => item.id !== "permissions");
  }, [isSupervisor]);

  useEffect(() => {
    loadCoreData();
    loadLogs();
    loadFiles();
    loadCapabilities();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [selectedGroupId, selectedScreenId]);

  useEffect(() => {
    if (!currentUser || isSupervisor) return;
    const userGroupId = resolveGroupId(currentGroupCode);
    if (Number(selectedGroupId) !== Number(userGroupId)) {
      setSelectedGroupId(userGroupId);
    }
  }, [currentGroupCode, currentUser, groups, isSupervisor, selectedGroupId]);

  useEffect(() => {
    if (!isSupervisor && activeTab === "permissions") {
      setActiveTab("dashboard");
    }
  }, [activeTab, isSupervisor]);

  useEffect(() => {
    if (!currentPermission) {
      setDraft(defaultPermissionDraft);
      return;
    }
    setDraft({
      can_create: Boolean(currentPermission.can_create),
      can_read: Boolean(currentPermission.can_read),
      can_update: Boolean(currentPermission.can_update),
      can_delete: Boolean(currentPermission.can_delete),
      can_upload: Boolean(currentPermission.can_upload),
      allowed_extensions: normalizeExtensions(currentPermission.allowed_extensions).join(",")
    });
  }, [currentPermission]);

  async function loadCoreData() {
    try {
      const [groupsData, screensData, permissionsData] = await Promise.all([
        fetchJson("/groups"),
        fetchJson("/screens"),
        fetchJson("/screens/permissions")
      ]);
      setGroups(groupsData);
      setScreens(screensData);
      setPermissions(permissionsData);
      setStatus("");
    } catch {
      setStatus("Arka uç hazır değil, demo veri ile açıldı");
    }
  }

  async function loadPermissions() {
    const permissionsData = await fetchJson("/screens/permissions");
    setPermissions(permissionsData);
  }

  async function savePermission() {
    setSaving(true);
    setStatus("");
    const body = {
      group_id: Number(selectedGroupId),
      screen_id: Number(selectedScreenId),
      can_create: draft.can_create,
      can_read: draft.can_read,
      can_update: draft.can_update,
      can_delete: draft.can_delete,
      can_upload: draft.can_upload,
      allowed_extensions: draft.allowed_extensions.split(",").map((item) => item.trim()).filter(Boolean),
      value: { source: "frontend-panel" }
    };

    try {
      const result = await fetchJson("/screens/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      await loadPermissions();
      await loadRecords();
      await loadLogs();
      setStatus(result.rpc?.message || "Yetki kaydedildi");
    } catch (error) {
      setStatus(error.message || "Yetki kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  async function loadRecords() {
    try {
      const data = await fetchJson(`/records?group_id=${selectedGroupId}&screen_id=${selectedScreenId}`);
      setRecords(data);
    } catch {
      setRecords([]);
    }
  }

  async function loadLogs() {
    try {
      setLogs(await fetchJson("/logs?limit=30"));
    } catch {
      setLogs([]);
    }
  }

  async function loadFiles() {
    try {
      setFiles(await fetchJson("/files"));
    } catch {
      setFiles([]);
    }
  }

  async function loadCapabilities() {
    try {
      setCapabilities(await fetchJson("/ai/capabilities"));
    } catch {
      setCapabilities(null);
    }
  }

  async function submitRecord() {
    let value;
    try {
      value = JSON.parse(recordJson);
    } catch {
      setStatus("JSON formatı hatalı");
      return;
    }

    setSaving(true);
    try {
      const path = editingRecordId ? `/records/${editingRecordId}` : "/records";
      const method = editingRecordId ? "PUT" : "POST";
      const body = editingRecordId
        ? { title: recordTitle, value }
        : {
            group_id: Number(selectedGroupId),
            screen_id: Number(selectedScreenId),
            title: recordTitle,
            value
          };

      const result = await fetchJson(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      setStatus(result.rpc?.message || (editingRecordId ? "Kayıt güncellendi" : "Kayıt oluşturuldu"));
      clearRecordForm();
      await loadRecords();
      await loadLogs();
    } catch (error) {
      setStatus(error.message || "Kayıt işlemi başarısız");
    } finally {
      setSaving(false);
    }
  }

  function startEditRecord(record) {
    setEditingRecordId(record.id);
    setRecordTitle(record.title);
    setRecordJson(JSON.stringify(record.value || {}, null, 2));
    setActiveTab("records");
  }

  function clearRecordForm() {
    setEditingRecordId("");
    setRecordTitle("Demo kayıt");
    setRecordJson('{\n  "not": "JSON veri örneği",\n  "durum": "aktif"\n}');
  }

  async function deleteRecord(recordId) {
    setSaving(true);
    try {
      const result = await fetchJson(`/records/${recordId}`, { method: "DELETE" });
      setStatus(result.rpc?.message || "Kayıt silindi");
      if (editingRecordId === recordId) clearRecordForm();
      await loadRecords();
      await loadLogs();
    } catch (error) {
      setStatus(error.message || "Kayıt silinemedi");
    } finally {
      setSaving(false);
    }
  }

  async function uploadSelectedFile() {
    if (!selectedUploadFile) {
      setStatus("Önce bir dosya seç");
      return;
    }

    setSaving(true);
    setStatus("");
    const formData = new FormData();
    formData.append("group_id", String(selectedGroupId));
    formData.append("screen_id", String(selectedScreenId));
    formData.append("file", selectedUploadFile);

    try {
      const result = await fetchJson("/files", { method: "POST", body: formData });
      setStatus(result.rpc?.message || "Dosya yüklendi");
      setSelectedUploadFile(null);
      setFileInputKey((current) => current + 1);
      await loadFiles();
      await loadLogs();
    } catch (error) {
      setStatus(error.message || "Dosya yüklenemedi");
    } finally {
      setSaving(false);
    }
  }

  async function analyzeFile(fileId) {
    setAnalyzingFileId(fileId);
    setStatus("");
    try {
      await fetchJson(`/files/${fileId}/analyze`, { method: "POST" });
      setStatus("Dosya yapay zeka servisi ile analiz edildi");
      await loadFiles();
      await loadLogs();
    } catch (error) {
      setStatus(error.message || "Analiz başarısız");
    } finally {
      setAnalyzingFileId("");
    }
  }

  async function runPrompt() {
    if (!prompt.trim()) {
      setStatus("Komut boş olamaz");
      return;
    }

    setSaving(true);
    setPromptResult(null);
    try {
      const result = await fetchJson("/ai/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          context: {
            group: selectedGroup?.code,
            screen: selectedScreen?.code,
            permission: currentPermission || draft
          }
        })
      });
      setPromptResult(result);
      setStatus("Yapay zeka komutu çalıştırıldı");
    } catch (error) {
      setStatus(error.message || "Yapay zeka servisi cevap vermedi");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginLoading(true);
    setStatus("");

    try {
      const result = await fetchJson("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });
      setCurrentUser(result.user);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("final_admin_user", JSON.stringify(result.user));
      }
      setSelectedGroupId(resolveGroupId(result.user.group_code));
      setActiveTab("dashboard");
      setStatus("");
    } catch (error) {
      const demoUser = demoLoginUsers.find(
        (user) => user.email === loginEmail.trim().toLowerCase() && user.password === loginPassword
      );
      if (demoUser) {
        const localUser = {
          email: demoUser.email,
          name: `Demo ${demoUser.label}`,
          role: demoUser.group_code,
          group_id: resolveGroupId(demoUser.group_code),
          group_code: demoUser.group_code,
          group_name: demoUser.label
        };
        setCurrentUser(localUser);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("final_admin_user", JSON.stringify(localUser));
        }
        setSelectedGroupId(localUser.group_id);
        setActiveTab("dashboard");
        setStatus("Backend kapalı olduğu için demo oturum açıldı");
        return;
      }
      setStatus(error.message || "Giriş başarısız");
    } finally {
      setLoginLoading(false);
    }
  }

  function selectDemoLogin(user) {
    setLoginEmail(user.email);
    setLoginPassword(user.password);
  }

  function handleLogout() {
    setCurrentUser(null);
    setActiveTab("dashboard");
    setStatus("");
    setLoginEmail("supervisor@example.com");
    setLoginPassword("123456");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("final_admin_user");
    }
  }

  if (!currentUser) {
    return renderLoginScreen();
  }

  return (
    <div className="min-h-screen bg-[#f6f7f3] text-stone-950">
      <aside className="fixed inset-y-0 left-0 hidden w-20 border-r border-stone-200 bg-white md:flex md:flex-col md:items-center md:gap-3 md:py-5">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-emerald-700 text-white">
          <Shield size={22} />
        </div>
        {visibleNavItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`focus-ring grid h-11 w-11 place-items-center rounded-lg transition ${
                active
                  ? "bg-emerald-700 text-white"
                  : "text-stone-500 hover:bg-amber-50 hover:text-emerald-800"
              }`}
              title={label}
              aria-label={label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </aside>

      <main className="md:pl-20">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">{displayGroupName(selectedGroup)}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-stone-950">Admin Paneli</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {visibleGroups.map((group) => {
                const Icon = groupIcons[group.code] || Shield;
                const active = selectedGroup?.id === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`focus-ring inline-flex h-10 items-center gap-2 rounded-lg border px-3 font-medium transition ${
                      active
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-emerald-600"
                    }`}
                  >
                    <Icon size={17} />
                    {displayGroupName(group)}
                  </button>
                );
              })}
              <div className="hidden h-7 w-px bg-stone-200 md:block" />
              <div className="inline-flex h-10 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 font-medium text-stone-700">
                {currentUser.name}
              </div>
              <button
                onClick={handleLogout}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 font-medium text-stone-700 transition hover:border-emerald-600"
              >
                <LogOut size={17} />
                Çıkış
              </button>
            </div>
          </div>
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 pb-4 md:hidden">
            {visibleNavItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${
                  activeTab === id
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-stone-200 bg-white text-stone-700"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-6">
          {status && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              {status}
            </div>
          )}
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "permissions" && isSupervisor && renderPermissions()}
          {activeTab === "records" && renderRecordsPanel()}
          {activeTab === "files" && renderFilesPanel()}
          {activeTab === "ai" && renderAiPanel()}
          {activeTab === "logs" && renderLogsPanel()}
        </section>
      </main>
    </div>
  );

  function renderLoginScreen() {
    return (
      <div className="min-h-screen bg-[#f6f7f3] text-stone-950">
        <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-5">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-700 text-white">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">Final Admin Paneli</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">Giriş Ekranı</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {demoLoginUsers.map((user) => {
                const Icon = groupIcons[user.group_code] || Shield;
                const active = loginEmail === user.email;
                return (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => selectDemoLogin(user)}
                    className={`focus-ring flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                      active
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-stone-200 bg-white text-stone-800 hover:border-emerald-600"
                    }`}
                  >
                    <Icon size={20} />
                    <span>
                      <span className="block text-sm font-semibold">{user.label}</span>
                      <span className={`block text-xs ${active ? "text-emerald-50" : "text-stone-500"}`}>
                        {user.email}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <form onSubmit={handleLogin} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-emerald-700">
                <LogIn size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Panele Giriş</h2>
                <p className="text-sm text-stone-500">Demo kullanıcı seç veya bilgileri elle yaz.</p>
              </div>
            </div>
            {status && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                {status}
              </div>
            )}
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-semibold text-stone-700">E-posta</span>
              <input
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="focus-ring h-11 w-full rounded-lg border border-stone-300 bg-white px-3"
                type="email"
                autoComplete="username"
              />
            </label>
            <label className="mb-5 block">
              <span className="mb-2 block text-sm font-semibold text-stone-700">Şifre</span>
              <input
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="focus-ring h-11 w-full rounded-lg border border-stone-300 bg-white px-3"
                type="password"
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              disabled={loginLoading}
              className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginLoading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              Giriş Yap
            </button>
          </form>
        </main>
      </div>
    );
  }

  function renderDashboard() {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric icon={ListChecks} label="Ekran" value={screens.length} />
          <Metric icon={Shield} label="Grup" value={groups.length} />
          <Metric icon={Check} label="İzin" value={permissions.length || "Demo"} />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {renderPermissionTable()}
          <div className="space-y-5">
            <InfoPanel
              icon={Database}
              title="Seçili Ekran"
              rows={[
                ["Grup", displayGroupName(selectedGroup)],
                ["Ekran", displayScreenTitle(selectedScreen)],
                ["Adres", selectedScreen?.route],
                ["Yükleme", draft.can_upload ? "Açık" : "Kapalı"]
              ]}
            />
            <InfoPanel
              icon={FileUp}
              title="Servis Durumu"
              rows={[
                ["Arka uç", "http://127.0.0.1:8000"],
                ["Ön yüz", "http://127.0.0.1:3001"],
                ["RabbitMQ", "http://127.0.0.1:15672"],
                ["MySQL", "127.0.0.1:3306"]
              ]}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderPermissions() {
    return (
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="text-emerald-700" size={20} />
            <h2 className="text-base font-semibold">Yetki Atama</h2>
          </div>

          <label className="mb-2 block text-sm font-medium text-stone-700">Ekran</label>
          <select
            value={selectedScreenId}
            onChange={(event) => setSelectedScreenId(event.target.value)}
            className="focus-ring mb-4 h-11 w-full rounded-lg border border-stone-300 bg-white px-3"
          >
            {screens.map((screen) => (
              <option key={screen.id} value={screen.id}>
                  {displayScreenTitle(screen)}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            {permissionFields.map(([field, label]) => (
              <label
                key={field}
                className="flex h-11 items-center justify-between rounded-lg border border-stone-200 px-3 text-sm font-medium"
              >
                {label}
                <input
                  type="checkbox"
                  checked={draft[field]}
                  onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.checked }))}
                  className="h-4 w-4 accent-emerald-700"
                />
              </label>
            ))}
          </div>

          <label className="mb-2 mt-4 block text-sm font-medium text-stone-700">Uzantılar</label>
          <input
            value={draft.allowed_extensions}
            onChange={(event) => setDraft((current) => ({ ...current, allowed_extensions: event.target.value }))}
            className="focus-ring h-11 w-full rounded-lg border border-stone-300 bg-white px-3"
          />

          <button
            onClick={savePermission}
            className="focus-ring mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 font-semibold text-white transition hover:bg-emerald-800"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Kaydet
          </button>
        </div>
        {renderPermissionTable()}
      </div>
    );
  }

  function renderPermissionTable() {
    return (
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="flex flex-col gap-1 border-b border-stone-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold">{displayGroupName(selectedGroup)} Ekranları</h2>
          <span className="text-sm text-stone-500">{selectedScreen?.route}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone-100 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Ekran</th>
                <th className="px-4 py-3">Adres</th>
                <th className="px-4 py-3">İşlemler</th>
                <th className="px-4 py-3">Yükleme</th>
                <th className="px-4 py-3">Uzantı</th>
              </tr>
            </thead>
            <tbody>
              {groupPermissions.map((permission) => (
                <tr
                  key={`${permission.group_code}-${permission.screen_code}`}
                  className="cursor-pointer border-t border-stone-100 hover:bg-stone-50"
                  onClick={() => {
                    const screen = screens.find((item) => item.code === permission.screen_code);
                    if (screen) setSelectedScreenId(screen.id);
                    setActiveTab("permissions");
                  }}
                >
                  <td className="px-4 py-3 font-medium">{displayPermissionScreenTitle(permission)}</td>
                  <td className="px-4 py-3 text-stone-500">{permission.route}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {["can_create", "can_read", "can_update", "can_delete"].map((field) => (
                        <span
                          key={field}
                          className={`grid h-7 w-7 place-items-center rounded-md text-xs font-bold ${
                            permission[field] ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          {operationShortLabel(field)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{permission.can_upload ? "Açık" : "Kapalı"}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {normalizeExtensions(permission.allowed_extensions).slice(0, 6).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderRecordsPanel() {
    return (
      <div className="grid gap-5 lg:grid-cols-[440px_1fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="text-emerald-700" size={20} />
              <h2 className="text-base font-semibold">JSON Kayıt İşlemleri</h2>
            </div>
            <button
              onClick={loadRecords}
              className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-stone-200 text-stone-600 hover:border-emerald-700 hover:text-emerald-800"
              title="Yenile"
              aria-label="Kayıtları yenile"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <ScreenSelector />
          <input
            value={recordTitle}
            onChange={(event) => setRecordTitle(event.target.value)}
            className="focus-ring mb-3 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm"
          />
          <textarea
            value={recordJson}
            onChange={(event) => setRecordJson(event.target.value)}
            className="focus-ring min-h-40 w-full resize-y rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm"
            spellCheck="false"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={submitRecord}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
              {editingRecordId ? "Kaydı Güncelle" : "Kayıt Oluştur"}
            </button>
            {editingRecordId && (
              <button
                onClick={clearRecordForm}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700"
              >
                <X size={17} />
                Vazgeç
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-4 py-3">
            <h2 className="text-base font-semibold">{displayScreenTitle(selectedScreen)} Kayıtları</h2>
            <p className="mt-1 text-sm text-stone-500">{displayGroupName(selectedGroup)} grubunun JSON tipindeki kayıtları</p>
          </div>
          <div className="divide-y divide-stone-100">
            {records.length === 0 ? (
              <p className="px-4 py-5 text-sm text-stone-500">Kayıt yok veya bu ekran için okuma izni kapalı.</p>
            ) : (
              records.map((record) => (
                <div key={record.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{record.title}</p>
                    <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-stone-100 p-3 text-xs text-stone-600">
                      {JSON.stringify(record.value, null, 2)}
                    </pre>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => startEditRecord(record)}
                      className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-emerald-50 hover:text-emerald-700"
                      title="Düzenle"
                      aria-label="Kaydı düzenle"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-700"
                      title="Sil"
                      aria-label="Kaydı sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderFilesPanel() {
    return (
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <FileUp className="text-emerald-700" size={20} />
            <h2 className="text-base font-semibold">Dosya Yükleme</h2>
          </div>
          <ScreenSelector />
          <div className="mb-3 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
            Yükleme: <strong>{draft.can_upload ? "Açık" : "Kapalı"}</strong> | Uzantı: {draft.allowed_extensions}
          </div>
          <input
            key={fileInputKey}
            type="file"
            onChange={(event) => setSelectedUploadFile(event.target.files?.[0] || null)}
            className="focus-ring block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          />
          <button
            onClick={uploadSelectedFile}
            className="focus-ring mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}
            Yükle
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <h2 className="text-base font-semibold">Yüklenen Dosyalar</h2>
            <button
              onClick={loadFiles}
              className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-stone-200 text-stone-600 hover:border-emerald-700 hover:text-emerald-800"
              title="Yenile"
              aria-label="Dosyaları yenile"
            >
              <RefreshCw size={17} />
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {files.length === 0 ? (
              <p className="px-4 py-5 text-sm text-stone-500">Henüz dosya yüklenmedi.</p>
            ) : (
              files.map((file) => (
                <div key={file.id} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{file.original_name}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {file.extension} | {fileStatusLabel(file.analysis_status)}
                      </p>
                    </div>
                    <button
                      onClick={() => analyzeFile(file.id)}
                      className="focus-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-emerald-700 hover:text-emerald-800"
                    >
                      {analyzingFileId === file.id ? <Loader2 className="animate-spin" size={16} /> : <Bot size={16} />}
                      Analiz Et
                    </button>
                  </div>
                  {file.value?.analysis && (
                    <pre className="mt-3 max-h-36 overflow-auto rounded-lg bg-stone-100 p-3 text-xs text-stone-600">
                      {JSON.stringify(file.value.analysis, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderAiPanel() {
    return (
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="text-emerald-700" size={20} />
            <h2 className="text-base font-semibold">Yapay Zeka Komutu</h2>
          </div>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="focus-ring min-h-36 w-full resize-y rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            onClick={runPrompt}
            className="focus-ring mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Play size={17} />}
            Çalıştır
          </button>
        </div>

        <div className="space-y-5">
          <InfoPanel
            icon={Bot}
            title="Yapay Zeka Servis Yetenekleri"
            rows={[
              ["RAG", capabilities?.rag?.enabled ? capabilityStatusLabel(capabilities.rag.status) : "Kapalı"],
              ["MCP", capabilities?.mcp?.enabled ? capabilityStatusLabel(capabilities.mcp.status) : "Kapalı"],
              ["Format", (capabilities?.formats || []).join(", ") || "Yok"]
            ]}
          />
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="text-emerald-700" size={20} />
              <h2 className="text-base font-semibold">Yapay Zeka Sonucu</h2>
            </div>
            {promptResult ? (
              <pre className="max-h-80 overflow-auto rounded-lg bg-stone-100 p-3 text-xs text-stone-600">
                {JSON.stringify(promptResult, null, 2)}
              </pre>
            ) : (
              <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-500">Komut çalıştırılınca sonuç burada görünür.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderLogsPanel() {
    return (
      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="text-base font-semibold">Sistem Logları</h2>
          <button
            onClick={loadLogs}
            className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-stone-200 text-stone-600 hover:border-emerald-700 hover:text-emerald-800"
            title="Yenile"
            aria-label="Logları yenile"
          >
            <RefreshCw size={17} />
          </button>
        </div>
        <div className="divide-y divide-stone-100">
          {logs.length === 0 ? (
            <p className="px-4 py-5 text-sm text-stone-500">Log yok veya arka uç kapalı.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="grid gap-2 p-4 md:grid-cols-[180px_1fr_70px]">
                <p className="text-sm font-semibold">{log.event_type}</p>
                <div>
                  <p className="text-sm text-stone-700">{logMessageLabel(log.message)}</p>
                  <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-stone-100 p-2 text-xs text-stone-500">
                    {JSON.stringify(log.value || {}, null, 2)}
                  </pre>
                </div>
                <span className={log.success ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-700"}>
                  {log.success ? "OK" : "ERR"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  function ScreenSelector() {
    return (
      <>
        <label className="mb-2 block text-sm font-medium text-stone-700">Ekran</label>
        <select
          value={selectedScreenId}
          onChange={(event) => setSelectedScreenId(event.target.value)}
          className="focus-ring mb-4 h-11 w-full rounded-lg border border-stone-300 bg-white px-3"
        >
          {screens.map((screen) => (
            <option key={screen.id} value={screen.id}>
              {displayScreenTitle(screen)}
            </option>
          ))}
        </select>
      </>
    );
  }

  function resolveGroupId(groupCode) {
    const apiGroup = groups.find((group) => group.code === groupCode);
    if (apiGroup) return apiGroup.id;
    return fallbackGroups.find((group) => group.code === groupCode)?.id || 1;
  }

  async function fetchJson(path, options) {
    const response = await fetch(`${API_URL}${path}`, options);
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
      throw new Error(data?.detail || data?.message || "Istek basarisiz");
    }
    return data;
  }
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-500">{label}</span>
        <Icon className="text-emerald-700" size={19} />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function InfoPanel({ icon: Icon, title, rows }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-emerald-700" size={20} />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 text-sm">
            <span className="font-medium text-stone-500">{label}</span>
            <span className="text-right text-stone-900">{value || "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function fallbackPermissionRows(group, screens) {
  return screens.map((screen) => ({
    group_code: group?.code,
    screen_code: screen.code,
    screen_title: screen.title,
    route: screen.route,
    can_create: group?.code === "supervisor",
    can_read: true,
    can_update: group?.code === "supervisor" || screen.code.includes("file"),
    can_delete: group?.code === "supervisor",
    can_upload: ["supervisor", "school", "company", "student"].includes(group?.code) && screen.code === "file-center",
    allowed_extensions: ["txt", "png", "jpg", "pdf", "docx"]
  }));
}

function displayGroupName(group) {
  return groupLabels[group?.code] || group?.name || "-";
}

function displayScreenTitle(screen) {
  return screenLabels[screen?.code] || screen?.title || "-";
}

function displayPermissionScreenTitle(permission) {
  return screenLabels[permission?.screen_code] || permission?.screen_title || "-";
}

function operationShortLabel(field) {
  return {
    can_create: "E",
    can_read: "O",
    can_update: "G",
    can_delete: "S"
  }[field] || "-";
}

function fileStatusLabel(status) {
  return {
    pending: "bekliyor",
    completed: "tamamlandı",
    failed: "başarısız"
  }[status] || "bekliyor";
}

function capabilityStatusLabel(status) {
  return {
    skeleton: "demo",
    ready: "hazır",
    disabled: "kapalı"
  }[status] || status || "-";
}

function logMessageLabel(message) {
  return {
    "Record created": "Kayıt oluşturuldu",
    "Record updated": "Kayıt güncellendi",
    "Record deleted": "Kayıt silindi",
    "Permission updated": "Yetki güncellendi",
    "File uploaded": "Dosya yüklendi",
    "File analyzed": "Dosya analiz edildi",
    "Group created": "Grup oluşturuldu",
    "Group deleted": "Grup silindi",
    "Database trigger log": "Veritabanı tetikleyici günlüğü",
    "RPC consumer received and logged the operation": "RabbitMQ consumer işlemi aldı ve logladı"
  }[message] || message || "-";
}

function normalizeExtensions(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

export default App;
