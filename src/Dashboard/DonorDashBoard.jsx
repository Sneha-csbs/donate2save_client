import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRequests } from "../context/RequestContext.jsx";
import { useAppointments } from "../context/AppointmentContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
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
  message,
  Modal,
  notification,
} from "antd";
import {
  HomeOutlined,
  HeartOutlined,
  HistoryOutlined,
  FileOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import "./css/DonorDashBoard.css";
import logo from '../assets/logo-donate2save.png';

const { Sider, Content, Footer } = Layout;

export default function DonorDashBoard() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState("home");
  const [todo, setTodo] = useState([
    { id: 1, text: "Drink enough water", done: true },
    { id: 2, text: "Bring valid ID", done: false },
    { id: 3, text: "Confirm appointment", done: false },
  ]);
  const [emergencyNotifications, setEmergencyNotifications] = useState([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const navigate = useNavigate();

  const { requests } = useRequests();
  const { appointments, donorHistory, donorStats, donorBadges, donorCertificates, addAppointment, addNotification, checkDonorEligibility, fetchDonorData } = useAppointments();
  const { user: authUser, logout } = useAuth();
  
  const currentDonorId = authUser?.id || authUser?._id;
  const [eligibilityStatus, setEligibilityStatus] = useState({ eligible: true, message: "Eligible to Donate" });

  // Fetch donor data and check eligibility on mount
  useEffect(() => {
    const fetchData = async () => {
      if (authUser?.role === 'donor') {
        await fetchDonorData();
        try {
          const status = await checkDonorEligibility();
          setEligibilityStatus(status);
        } catch (error) {
          console.error('Failed to check eligibility:', error);
        }
        
        // Check for emergency contact requests
        await checkEmergencyNotifications();
      }
    };
    fetchData();
  }, [authUser]);

  // Check for emergency contact requests
  const checkEmergencyNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://donate2save-server.onrender.com/api/notifications/emergency', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const notifications = await response.json();
        if (notifications.length > 0) {
          setEmergencyNotifications(notifications);
          setShowEmergencyModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch emergency notifications:', error);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`https://donate2save-server.onrender.com/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle emergency notification response
  const handleEmergencyResponse = async (notification, response) => {
    try {
      await markNotificationRead(notification._id);
      
      if (response === 'accept') {
        // Create appointment for emergency request
        const userId = authUser?.id || authUser?._id;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const appointmentDate = tomorrow.toISOString().split('T')[0];
        const appointmentTime = "10:00";
        
        await addAppointment({
          date: appointmentDate,
          donor: user.name,
          donorId: userId,
          requesterId: notification.requesterId,
          bg: notification.bloodGroup,
          time: appointmentTime,
          requestId: notification.requestId,
          hospital: notification.hospitalName,
          status: "Pending"
        });
        
        message.success(`Emergency request accepted! Appointment scheduled for ${appointmentDate} at ${appointmentTime}`);
        setPage('appointments');
      } else {
        message.info('Emergency request declined.');
      }
      
      // Remove this notification from the list
      setEmergencyNotifications(prev => prev.filter(n => n._id !== notification._id));
      
      // Close modal if no more notifications
      if (emergencyNotifications.length <= 1) {
        setShowEmergencyModal(false);
      }
    } catch (error) {
      message.error('Failed to respond to emergency request');
    }
  };
  const currentDonorStats = donorStats[currentDonorId] || { totalDonations: 0, thisYear: 0 };

  const user = {
    name: authUser?.name || "User",
    bloodGroup: authUser?.bloodGroup || "O+",
    city: authUser?.city || "City",
    totalDonations: currentDonorStats.totalDonations,
    thisYear: currentDonorStats.thisYear,
  };

  const toggleTodo = (id) => {
    setTodo(todo.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };
  
  // Filter requests compatible with donor's blood group
  const compatibleRequests = requests.filter(req => {
    // Only show requests that match donor's blood group
    return req.status === "open" && req.bloodGroup === user.bloodGroup;
  }).map(req => ({
    id: req._id || req.id,
    _id: req._id,
    requesterId: req.requesterId,
    bg: req.bloodGroup,
    hospital: req.hospital,
    urgency: req.urgency,
    dist: "1.5 km" // Demo distance
  }));

  const history = Array.isArray(donorHistory) ? donorHistory.filter(h => h.donorId === currentDonorId) : [];

  const certificates = donorCertificates[currentDonorId] || [];
  const badges = donorBadges[currentDonorId] || [];

  // Get donor's appointments
  const donorAppointments = appointments.filter(apt => 
    apt.donorId === currentDonorId || apt.donorId === authUser?.id || apt.donorId === authUser?._id
  );

  const menuItems = [
    { key: "home", icon: <HomeOutlined />, label: "Home" },
    { key: "requests", icon: <HeartOutlined />, label: "Requests" },
    { key: "appointments", icon: <CalendarOutlined />, label: "Appointments" },
    { key: "history", icon: <HistoryOutlined />, label: "History" },
    { key: "certificates", icon: <FileOutlined />, label: "Certificates" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      
      {/* LEFT SIDEBAR ONLY */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="sidebar"
      >
        <div className="logoBox">
          <img className='logo'src={logo}></img>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[page]}
          onClick={(e) => setPage(e.key)}
          items={menuItems}
          className="menuItems"
        />
        <button className="logout" onClick={() => { logout(); navigate('/login'); }}>Log Out</button>
      </Sider>

      {/* MAIN CONTENT */}
      <Layout>
        <Content className="content">

          {/* HOME */}
          {page === "home" && (
            <div>
              <Card className="card">
                <h1 className="welcomeTitle">Welcome back, {user.name}! 👋</h1>
                <p className="welcomeSub">{user.bloodGroup} Donor • {user.city}</p>
              </Card>

              <Row gutter={16}>
                <Col span={12}>
                  <Card className="card" title="Eligibility Status">
                    <Tag color={eligibilityStatus.eligible ? "green" : "red"} style={{ fontSize: 14, padding: "5px 10px" }}>
                      {eligibilityStatus.message}
                    </Tag>
                    <p style={{ marginTop: 10, fontSize: "15px" }}>
                      {eligibilityStatus.eligible ? "You are currently eligible to donate blood." : "Please wait before your next donation."}
                    </p>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card className="card" title="Quick Stats">
                    <Row>
                      <Col span={8}>
                        <Statistic title="Total" value={user.totalDonations} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="This Year" value={user.thisYear} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="Next Badge" value={
                          user.totalDonations === 0 ? "1 left" :
                          user.totalDonations < 3 ? `${3 - user.totalDonations} left` :
                          user.totalDonations < 10 ? `${10 - user.totalDonations} left` :
                          user.totalDonations < 25 ? `${25 - user.totalDonations} left` :
                          user.totalDonations < 50 ? `${50 - user.totalDonations} left` :
                          "All earned!"
                        } />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>

              <Card className="card" title="To-Do List">
                <List
                  dataSource={todo}
                  renderItem={(t) => (
                    <List.Item>
                      <label className="todoItem">
                        <input 
                          type="checkbox" 
                          checked={t.done} 
                          onChange={() => toggleTodo(t.id)}
                        /> {" "}
                        <span className={t.done ? "done" : ""}>{t.text}</span>
                      </label>
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          )}

          {/* REQUESTS */}
          {page === "requests" && (
            <Card className="card" title="Nearby Requests">
              <List
                dataSource={compatibleRequests}
                renderItem={(r) => {
                  // Check if this request has been accepted by this donor
                  const existingAppointment = donorAppointments.find(apt => apt.requestId === r.id);
                  
                  return (
                    <List.Item
                      actions={[
                        existingAppointment ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <Tag color={existingAppointment.status === "Pending" ? "orange" : existingAppointment.status === "Completed" ? "green" : "blue"}>
                              {existingAppointment.status === "Accepted" ? "Donated" : existingAppointment.status}
                            </Tag>
                            <span style={{ fontSize: '12px', color: '#666' }}>Waiting for requester to close</span>
                          </div>
                        ) : (
                          <Button danger size="small" disabled={!eligibilityStatus.eligible} onClick={async () => {
                            if (!eligibilityStatus.eligible) {
                              message.warning(eligibilityStatus.message);
                              return;
                            }
                            
                            console.log('Debug - authUser:', authUser);
                            console.log('Debug - request:', r);
                            console.log('Debug - authUser.id:', authUser?.id);
                            console.log('Debug - r.requesterId:', r.requesterId);
                            
                            const userId = authUser?.id || authUser?._id;
                            if (!userId) {
                              message.error('User not authenticated. Please login again.');
                              return;
                            }
                            
                            if (!r.requesterId) {
                              message.error('Invalid request data. Please refresh the page.');
                              return;
                            }
                            
                            try {
                              // Auto-generate appointment time (next day at 10 AM)
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              const appointmentDate = tomorrow.toISOString().split('T')[0];
                              const appointmentTime = "10:00";
                              
                              console.log('Creating appointment for request:', r);
                              console.log('User data:', user);
                              
                              // Create appointment with auto-scheduled time
                              await addAppointment({
                                date: appointmentDate,
                                donor: user.name,
                                donorId: userId,
                                requesterId: r.requesterId,
                                bg: r.bg,
                                time: appointmentTime,
                                requestId: r._id || r.id,
                                hospital: r.hospital,
                                status: "Pending"
                              });
                              
                              // Notify donor
                              addNotification({
                                id: Date.now(),
                                type: "appointment_scheduled",
                                message: `Your appointment is scheduled for ${appointmentDate} at ${appointmentTime} at ${r.hospital}`,
                                requestId: r._id || r.id || 'temp-' + Date.now(),
                                read: false,
                                timestamp: new Date().toISOString()
                              });
                              
                              message.success(`Request accepted! Appointment scheduled for ${appointmentDate} at ${appointmentTime}`);
                              
                              // Refresh appointments to show the new one
                              setTimeout(() => {
                                window.location.reload();
                              }, 1000);
                            } catch (error) {
                              console.error('Failed to accept request:', error);
                              message.error('Failed to accept request. Please try again.');
                            }
                          }}>Accept</Button>
                        )
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar className="bloodAvatar">{r.bg}</Avatar>}
                        title={<span className="reqHospital">{r.hospital}</span>}
                        description={`${r.urgency} • ${r.dist}`}
                      />
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}

          {/* APPOINTMENTS */}
          {page === "appointments" && (
            <Card className="card" title="My Appointments">
              <List
                dataSource={donorAppointments}
                renderItem={(a) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar className="bloodAvatar">{a.bg}</Avatar>}
                      title={<span className="reqHospital">{a.hospital}</span>}
                      description={
                        <div>
                          <div>{a.date && a.time ? `${a.date} at ${a.time}` : "Awaiting schedule from hospital"}</div>
                          <Tag color={
                            a.status === "Completed" ? "green" : 
                            a.status === "Verified" ? "blue" : 
                            a.status === "Pending" ? "orange" : "red"
                          }>
                            {a.status === "Accepted" ? "Waiting for Schedule" : a.status}
                          </Tag>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* HISTORY */}
          {page === "history" && (
            <Card className="card" title="Donation History">
              <List
                dataSource={history}
                renderItem={(h) => (
                  <List.Item style={{ fontSize: "15px" }}>
                    <strong>{h.date}</strong> — {h.place} ({h.units} unit)
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* CERTIFICATES */}
          {page === "certificates" && (
            <div>
              <Card className="card" title="Certificates">
                <List
                  dataSource={certificates}
                  renderItem={(c) => (
                    <List.Item>
                      <strong>{c.date}</strong> —
                      <Button className='but' size="small" style={{ marginLeft: 10 }} onClick={() => {
                        const certificateHTML = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                            .certificate { border: 3px solid #A30029; padding: 30px; margin: 20px; }
                            .title { font-size: 24px; font-weight: bold; color: #A30029; margin-bottom: 20px; }
                            .content { font-size: 16px; line-height: 1.6; }
                            .name { font-size: 20px; font-weight: bold; margin: 15px 0; }
                            .footer { margin-top: 30px; font-size: 14px; color: #666; }
                          </style>
                        </head>
                        <body>
                          <div class="certificate">
                            <div class="title">BLOOD DONATION CERTIFICATE</div>
                            <div class="content">
                              <p>This is to certify that</p>
                              <div class="name">${user.name}</div>
                              <p>has successfully donated blood on <strong>${c.date}</strong><br>
                              at <strong>${c.place}</strong></p>
                              <p>Blood Group: <strong>${user.bloodGroup}</strong><br>
                              Units Donated: <strong>${c.units}</strong></p>
                              <p>Thank you for your generous contribution to saving lives.</p>
                            </div>
                            <div class="footer">
                              <strong>Donate2Save</strong><br>
                              ${new Date().getFullYear()}
                            </div>
                          </div>
                        </body>
                        </html>`;
                        
                        const blob = new Blob([certificateHTML], { type: 'text/html' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `donation_certificate_${c.date}.html`;
                        link.click();
                        window.URL.revokeObjectURL(url);
                        message.success('Certificate downloaded as HTML (can be printed as PDF)');
                      }}>Download</Button>
                    </List.Item>
                  )}
                />
              </Card>

              <Card className="card" title="Badges">
                {badges.map((b, i) => (
                  <Tag key={i} color="#A30029" className="badgeTag">{b}</Tag>
                ))}
              </Card>
            </div>
          )}

        </Content>

        <Footer className="footer">
          Donate2Save © {new Date().getFullYear()} — Every drop counts
        </Footer>
      </Layout>

      {/* Emergency Contact Request Modal */}
      <Modal
        title="🚨 EMERGENCY BLOOD REQUEST"
        open={showEmergencyModal}
        footer={null}
        closable={false}
        centered
        width={500}
        bodyStyle={{ padding: '20px' }}
      >
        {emergencyNotifications.map((notification, index) => (
          <div key={notification._id} style={{ marginBottom: index < emergencyNotifications.length - 1 ? '20px' : '0' }}>
            <div style={{ 
              background: '#fff2f0', 
              border: '2px solid #ff4d4f', 
              borderRadius: '8px', 
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ color: '#ff4d4f', margin: '0 0 8px 0' }}>URGENT REQUEST</h3>
              <p style={{ fontSize: '16px', margin: '8px 0' }}>
                <strong>{notification.hospitalName}</strong> urgently needs <strong>{notification.bloodGroup}</strong> blood donation.
              </p>
              <p style={{ margin: '8px 0', color: '#666' }}>
                {notification.message}
              </p>
              <p style={{ fontSize: '14px', color: '#999', margin: '8px 0 16px 0' }}>
                Received: {new Date(notification.createdAt).toLocaleString()}
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Button 
                  type="primary" 
                  danger 
                  size="large"
                  onClick={() => handleEmergencyResponse(notification, 'accept')}
                >
                  Accept Emergency Request
                </Button>
                <Button 
                  size="large"
                  onClick={() => handleEmergencyResponse(notification, 'decline')}
                >
                  Not Available
                </Button>
              </div>
            </div>
          </div>
        ))}
      </Modal>
    </Layout>
  );
}
