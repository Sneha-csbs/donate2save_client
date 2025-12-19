import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRequests } from "../context/RequestContext.jsx";
import { useAppointments } from "../context/AppointmentContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { donorAPI } from "../services/api.js";
import {
  Layout,
  Menu,
  Card,
  List,
  Tag,
  Avatar,
  Button,
  Statistic,
  Row,
  Col,
  Modal,
  Input,
  Select,
  InputNumber,
  message
} from "antd";
import {
  HomeOutlined,
  FormOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  FileOutlined,
} from "@ant-design/icons";
import "./css/RequesterDashBoard.css";
import logo from "../assets/logo-donate2save.png";

const { Sider, Content, Footer } = Layout;
const { TextArea } = Input;
const { Option } = Select;

export default function RequesterDashBoard() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState("home"); // home | requests | inventory | appointments | reports
  const [showCreate, setShowCreate] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showInventoryUpdate, setShowInventoryUpdate] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");
  const [newQuantity, setNewQuantity] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ date: "", time: "" });
  const navigate = useNavigate();

  const { user: authUser, logout } = useAuth();
  
  const requester = {
    orgName: authUser?.orgName || "Hospital",
    contact: authUser?.contact || "Contact",
    city: authUser?.city || "City",
  };

  const [inventory, setInventory] = useState({
    "O+": 6,
    "O-": 0,
    "A+": 3,
    "A-": 1,
    "B+": 2,
    "B-": 0,
    "AB+": 1,
    "AB-": 0,
  });

  const { requests, addRequest, setRequests, deleteRequest } = useRequests();
  const { appointments, notifications, updateAppointmentStatus, markNotificationRead, setAppointments } = useAppointments();

  // Fetch donor counts for all blood groups when requests change
  useEffect(() => {
    const fetchAllDonorCounts = async () => {
      const bloodGroups = [...new Set(requests.map(r => r.bloodGroup))];
      
      for (const bloodGroup of bloodGroups) {
        if (!donorCounts[bloodGroup]) {
          try {
            const donors = await donorAPI.getByBloodGroup(bloodGroup);
            setDonorCounts(prev => ({
              ...prev,
              [bloodGroup]: donors.length
            }));
          } catch (error) {
            console.error(`Failed to fetch donors for ${bloodGroup}:`, error);
          }
        }
      }
    };

    if (requests.length > 0) {
      fetchAllDonorCounts();
    }
  }, [requests]);

  // Calculate dynamic stats from actual data
  const activeRequestsCount = requests.filter(r => r.status === "open").length;
  const matchedDonorsCount = requests.filter(r => r.status === "matched").length * 2; // Assume 2 donors per matched request



  // Create Request form state
  const [form, setForm] = useState({ bloodGroup: "", units: 1, urgency: "HIGH", notes: "" });

  function handleCreateChange(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function submitCreate() {
    if (!form.bloodGroup || !form.units) {
      message.error("Please select blood group and units");
      return;
    }
    try {
      const newReq = {
        bloodGroup: form.bloodGroup,
        units: form.units,
        urgency: form.urgency,
        notes: form.notes,
        hospital: requester.orgName,
      };
      await addRequest(newReq);
      setShowCreate(false);
      setForm({ bloodGroup: "", units: 1, urgency: "HIGH", notes: "" });
      message.success("Request created successfully");
    } catch (error) {
      message.error("Failed to create request");
    }
  }

  function acceptDonor(requestId, donorId) {
    // placeholder: accept donor for request
    message.info(`Accepted donor ${donorId} for request ${requestId} (demo)`);
  }

  function exportRequestsReport() {
    const csvData = [
      ['Blood Group', 'Units', 'Urgency', 'Status', 'Hospital', 'Created At'],
      ...requests.map(r => [r.bloodGroup, r.units, r.urgency, r.status, r.hospital, r.createdAt])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blood_requests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success('Requests report exported successfully');
  }

  function exportAppointmentsReport() {
    const csvData = [
      ['Donor', 'Date', 'Time', 'Blood Group', 'Hospital', 'Status', 'Created At'],
      ...appointments.map(a => [a.donor, a.date, a.time, a.bg, a.hospital, a.status, a.createdAt])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success('Appointments report exported successfully');
  }

  function exportInventoryReport() {
    const csvData = [
      ['Blood Group', 'Units Available'],
      ...Object.entries(inventory).map(([bg, qty]) => [bg, qty])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success('Inventory report exported successfully');
  }

  function viewMatches(request) {
    setSelectedRequest(request);
    fetchCompatibleDonors(request.bloodGroup);
    setShowMatches(true);
  }

  function updateInventory(bloodGroup) {
    setSelectedBloodGroup(bloodGroup);
    setNewQuantity(inventory[bloodGroup]);
    setShowInventoryUpdate(true);
  }

  function submitInventoryUpdate() {
    setInventory(prev => ({
      ...prev,
      [selectedBloodGroup]: newQuantity
    }));
    setShowInventoryUpdate(false);
    message.success(`${selectedBloodGroup} inventory updated to ${newQuantity} units`);
  }

  function scheduleAppointment(appointment) {
    setSelectedAppointment(appointment);
    setScheduleForm({ date: "", time: "" });
    setShowSchedule(true);
  }

  function submitSchedule() {
    if (!scheduleForm.date || !scheduleForm.time) {
      message.error("Please select both date and time");
      return;
    }
    
    // Update appointment with date, time and status
    updateAppointmentStatus(selectedAppointment.id, "Pending", {
      date: scheduleForm.date,
      time: scheduleForm.time
    });
    
    setShowSchedule(false);
    message.success(`Appointment scheduled for ${scheduleForm.date} at ${scheduleForm.time}`);
  }

  const [compatibleDonors, setCompatibleDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [donorCounts, setDonorCounts] = useState({});

  // Fetch compatible donors for a blood group
  const fetchCompatibleDonors = async (bloodGroup) => {
    try {
      setLoadingDonors(true);
      const donors = await donorAPI.getByBloodGroup(bloodGroup);
      setCompatibleDonors(donors);
      
      // Store the count for this blood group
      setDonorCounts(prev => ({
        ...prev,
        [bloodGroup]: donors.length
      }));
    } catch (error) {
      console.error('Failed to fetch donors:', error);
      setCompatibleDonors([]);
    } finally {
      setLoadingDonors(false);
    }
  };

  const menuItems = [
    { key: "home", icon: <HomeOutlined />, label: "Home" },
    { key: "requests", icon: <FormOutlined />, label: "Requests" },
    { key: "inventory", icon: <DatabaseOutlined />, label: "Inventory" },
    { key: "appointments", icon: <CalendarOutlined />, label: "Appointments" },
    { key: "reports", icon: <FileOutlined />, label: "Reports" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="sidebar requester-sidebar"
      >
        <div className="logoBox">
          <img className="logo" src={logo} alt="Donate2Save" />
        </div>

        <Menu
          mode="inline"
          selectedKeys={[page]}
          onClick={(e) => setPage(e.key)}
          items={menuItems}
          className="menuItems"
        />

        <button className="r-logout" onClick={() => { logout(); navigate("/login"); }}>Log Out</button>
      </Sider>

      <Layout>
        <Content className="content requester-content">
          {/* HOME */}
          {page === "home" && (
            <div>
              <Card className="card">
                <h1 className="welcomeTitle">{requester.orgName} — Dashboard</h1>
                <p className="welcomeSub">Contact: {requester.contact} • {requester.city}</p>
              </Card>

              <Row gutter={16}>
                <Col span={12}>
                  <Card className="card" title="Quick Overview">
                    <Row>
                      <Col span={12}>
                        <Statistic title="Active Requests" value={activeRequestsCount} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Matched Donors" value={matchedDonorsCount} />
                      </Col>
                    </Row>
                    <div style={{ marginTop: 12 }}>
                      <Button type="primary" onClick={() => setShowCreate(true)}>Create Request</Button>
                      <Button style={{ marginLeft: 8 }} onClick={exportRequestsReport}>Export Requests</Button>
                    </div>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card className="card" title="Inventory Snapshot">
                    <List
                      dataSource={Object.entries(inventory).sort(([a], [b]) => {
                        const order = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
                        return order.indexOf(a) - order.indexOf(b);
                      }).slice(0, 4)}
                      renderItem={([bg, qty]) => (
                        <List.Item>
                          <div style={{ fontWeight: 700 }}>{bg}</div>
                          <div style={{ marginLeft: "auto" }} className={qty === 0 ? "low" : ""}>{qty} units</div>
                        </List.Item>
                      )}
                    />
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <Button className="va-button" size="small" onClick={() => setPage("inventory")}>View All</Button>
                    </div>
                  </Card>
                </Col>
              </Row>

              <Card className="card" title="Recent Requests">
                <List
                  dataSource={requests.slice(0, 5)}
                  renderItem={(r) => (
                    <List.Item
                      actions={[
                        <Button size="small" onClick={() => { setPage("requests"); message.info("Open Requests tab"); }}>
                          Manage
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Tag color={r.urgency === "CRITICAL" ? "red" : r.urgency === "HIGH" ? "orange" : "default"}>{r.bloodGroup}</Tag>}
                        title={<span style={{ fontWeight: 700 }}>{r.bloodGroup} • {r.hospital}</span>}
                        description={`${r.units} unit(s) • ${r.createdAt} • status: ${r.status}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          )}

          {/* REQUESTS */}
          {page === "requests" && (
            <div>
              <Card className="card" title="Active Requests">
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <Button type="primary" onClick={() => setShowCreate(true)}>Create Request</Button>
                </div>

                <List
                  dataSource={requests}
                  renderItem={(r) => (
                    <List.Item
                      actions={[
                        <Button danger size="small" onClick={async () => {
                          try {
                            await deleteRequest(r._id);
                            message.success("Request cancelled and deleted");
                          } catch (error) {
                            message.error("Failed to delete request");
                          }
                        }}>Cancel</Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Tag color={r.urgency === "CRITICAL" ? "red" : r.urgency === "HIGH" ? "orange" : "default"}>{r.bloodGroup}</Tag>}
                        title={<span style={{ fontWeight: 700 }}>{r.bloodGroup} • {r.hospital}</span>}
                        description={`${r.units} unit(s) • ${r.createdAt} • status: ${r.status}`}
                      />
                      <div style={{ textAlign: "right" }}>
                        <div className="muted">Matched donors: {donorCounts[r.bloodGroup] || 0}</div>
                        <Button size="small" style={{ marginTop: 8 }} onClick={() => viewMatches(r)}>View Matches</Button>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          )}

          {/* Matched Donors Modal */}
          <Modal
            title={`Matched Donors for ${selectedRequest?.bloodGroup} Request`}
            open={showMatches}
            onCancel={() => setShowMatches(false)}
            footer={[
              <Button key="close" onClick={() => setShowMatches(false)}>Close</Button>
            ]}
            width={700}
          >
            {loadingDonors ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading donors...</div>
            ) : (
              <List
                dataSource={compatibleDonors}
                renderItem={(donor) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="primary" 
                        size="small" 
                        disabled={!donor.eligible}
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            await fetch('http://localhost:5000/api/appointments/emergency-contact', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                donorId: donor._id,
                                message: `🚨 EMERGENCY: ${requester.orgName} urgently needs ${selectedRequest.bloodGroup} blood donation`,
                                requestId: selectedRequest._id
                              })
                            });
                            
                            message.success(`Emergency contact sent to ${donor.name}`);
                            setShowMatches(false);
                          } catch (error) {
                            message.error('Failed to send emergency contact');
                          }
                        }}
                      >
                        {donor.eligible ? 'Contact Donor' : 'Unavailable'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: '#A30029' }}>{donor.bloodGroup}</Avatar>}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{donor.name}</span>
                          <Tag color={donor.eligible ? 'green' : 'red'}>
                            {donor.eligible ? 'Available' : 'Not Available'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div>Blood Group: {donor.bloodGroup}</div>
                          <div>City: {donor.city}</div>
                          <div>Phone: {donor.phone}</div>
                          <div>Status: {donor.eligibilityMessage}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Modal>

          {/* INVENTORY */}
          {page === "inventory" && (
            <Card className="card" title="Inventory Management">
              <List
                dataSource={Object.entries(inventory).sort(([a], [b]) => {
                  const order = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
                  return order.indexOf(a) - order.indexOf(b);
                })}
                renderItem={([bg, qty]) => (
                  <List.Item actions={[<Button size="small" onClick={() => updateInventory(bg)}>Update</Button>]}>
                    <div style={{ fontWeight: 700 }}>{bg}</div>
                    <div style={{ marginLeft: "auto" }} className={qty === 0 ? "low" : ""}>{qty} units</div>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* APPOINTMENTS */}
          {page === "appointments" && (
            <Card className="card" title="Appointments / Schedule">
              {appointments.length === 0 ? (
                <p>No appointments yet. Appointments will appear here when donors accept requests.</p>
              ) : (
                <List
                  dataSource={appointments}
                  renderItem={(a) => {
                    console.log('Appointment:', a); // Debug log
                    console.log('Status check - Accepted:', a.status === "Accepted");
                    
                    return (
                      <List.Item
                        actions={[
                          a.status === "Pending" && (
                            <Button key="verify" size="small" onClick={async () => {
                              try {
                                await updateAppointmentStatus(a._id, "Verified");
                                message.success("Appointment verified");
                              } catch (error) {
                                message.error("Failed to verify appointment");
                              }
                            }}>Verify</Button>
                          ),
                          a.status === "Verified" && (
                            <Button key="complete" type="primary" size="small" onClick={async () => {
                              try {
                                await updateAppointmentStatus(a._id, "Completed");
                                message.success("Donation completed and added to donor history");
                              } catch (error) {
                                message.error("Failed to complete appointment");
                              }
                            }}>Mark Complete</Button>
                          )
                        ].filter(Boolean)}
                      >
                        <div style={{ fontWeight: 700 }}>
                          {a.time || "No time set"}
                        </div>
                        <div style={{ marginLeft: 12 }}>{a.donor} ({a.bg}) - Status: "{a.status}"</div>
                        <div style={{ marginLeft: "auto" }}>
                          <Tag color={
                            a.status === "Completed" ? "green" : 
                            a.status === "Verified" ? "blue" : 
                            a.status === "Pending" ? "orange" :
                            "red"
                          }>
                            {a.status}
                          </Tag>
                        </div>
                      </List.Item>
                    );
                  }}
                />
              )}

            </Card>
          )}

          {/* REPORTS */}
          {page === "reports" && (
            <div>
              <Card className="card" title="Requests Report">
                <p className="muted">Download reports of blood requests.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button className="but" onClick={exportRequestsReport}>Export Requests CSV</Button>
                </div>
              </Card>

              <Card className="card" title="Appointments Report">
                <p className="muted">Download reports of appointments and donations.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button className="but" onClick={exportAppointmentsReport}>Export Appointments CSV</Button>
                </div>
              </Card>

              <Card className="card" title="Inventory Report">
                <p className="muted">Download current blood inventory status.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button className="but" onClick={exportInventoryReport}>Export Inventory CSV</Button>
                </div>
              </Card>
            </div>
          )}

          {/* Create Request Modal */}
          <Modal
            title="Create Blood Request"
            open={showCreate}
            onCancel={() => setShowCreate(false)}
            onOk={submitCreate}
            okText="Create"
          >
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontWeight: 700 }}>Blood Group</label>
              <Select value={form.bloodGroup} onChange={(v) => handleCreateChange("bloodGroup", v)} placeholder="Select blood group">
                <Option value="O+">O+</Option>
                <Option value="O-">O-</Option>
                <Option value="A+">A+</Option>
                <Option value="A-">A-</Option>
                <Option value="B+">B+</Option>
                <Option value="B-">B-</Option>
                <Option value="AB+">AB+</Option>
                <Option value="AB-">AB-</Option>
              </Select>

              <label style={{ fontWeight: 700 }}>Units</label>
              <InputNumber min={1} value={form.units} onChange={(v) => handleCreateChange("units", v)} />

              <label style={{ fontWeight: 700 }}>Urgency</label>
              <Select value={form.urgency} onChange={(v) => handleCreateChange("urgency", v)}>
                <Option value="CRITICAL">CRITICAL</Option>
                <Option value="HIGH">HIGH</Option>
                <Option value="MEDIUM">MEDIUM</Option>
                <Option value="LOW">LOW</Option>
              </Select>

              <label style={{ fontWeight: 700 }}>Notes (optional)</label>
              <TextArea rows={3} value={form.notes} onChange={(e) => handleCreateChange("notes", e.target.value)} />
            </div>
          </Modal>

          {/* Update Inventory Modal */}
          <Modal
            title={`Update ${selectedBloodGroup} Inventory`}
            open={showInventoryUpdate}
            onCancel={() => setShowInventoryUpdate(false)}
            onOk={submitInventoryUpdate}
            okText="Update"
          >
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontWeight: 700 }}>Blood Group</label>
              <Input value={selectedBloodGroup} disabled />
              
              <label style={{ fontWeight: 700 }}>Current Quantity</label>
              <Input value={`${inventory[selectedBloodGroup]} units`} disabled />
              
              <label style={{ fontWeight: 700 }}>New Quantity</label>
              <InputNumber 
                min={0} 
                value={newQuantity} 
                onChange={(value) => setNewQuantity(value)} 
                style={{ width: '100%' }}
              />
            </div>
          </Modal>

          {/* Schedule Appointment Modal */}
          <Modal
            title={`Schedule Appointment - ${selectedAppointment?.donor}`}
            open={showSchedule}
            onCancel={() => setShowSchedule(false)}
            onOk={submitSchedule}
            okText="Schedule"
          >
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontWeight: 700 }}>Donor</label>
              <Input value={selectedAppointment?.donor} disabled />
              
              <label style={{ fontWeight: 700 }}>Blood Group</label>
              <Input value={selectedAppointment?.bg} disabled />
              
              <label style={{ fontWeight: 700 }}>Date</label>
              <Input 
                type="date" 
                value={scheduleForm.date} 
                onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
              
              <label style={{ fontWeight: 700 }}>Time</label>
              <Input 
                type="time" 
                value={scheduleForm.time} 
                onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </Modal>
        </Content>

        <Footer className="footer">
          Donate2Save © {new Date().getFullYear()} — Hospital Dashboard
        </Footer>
      </Layout>
    </Layout>
  );
}
