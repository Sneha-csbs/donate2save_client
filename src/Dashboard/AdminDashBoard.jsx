import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Layout,
  Menu,
  Card,
  Table,
  Button,
  message,
  Popconfirm,
  Modal,
  Input,
  Select,
} from "antd";
import {
  HomeOutlined,
  UserOutlined,
  FormOutlined,
  CalendarOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import "./css/DonorDashBoard.css";
import logo from "../assets/logo-donate2save.png";

const { Sider, Content, Footer } = Layout;

export default function AdminDashBoard() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState("home");
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [donorHistory, setDonorHistory] = useState([]);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  useEffect(() => {
    if (authUser?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [authUser, navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [usersRes, requestsRes, appointmentsRes, historyRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/requests', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/donor-history', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
      if (historyRes.ok) setDonorHistory(await historyRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const editUser = (user) => {
    setEditingUser(user);
    setShowEditUser(true);
  };

  const updateUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
        setShowEditUser(false);
        message.success('User updated successfully');
      }
    } catch (error) {
      message.error('Failed to update user');
    }
  };

  const deleteUser = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== id));
        message.success('User deleted successfully');
      }
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const deleteRequest = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(requests.filter(r => r._id !== id));
        message.success('Request deleted successfully');
      }
    } catch (error) {
      message.error('Failed to delete request');
    }
  };

  const deleteAppointment = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAppointments(appointments.filter(a => a._id !== id));
        message.success('Appointment deleted successfully');
      }
    } catch (error) {
      message.error('Failed to delete appointment');
    }
  };

  const userColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Blood Group', dataIndex: 'bloodGroup', key: 'bloodGroup' },
    { title: 'City', dataIndex: 'city', key: 'city' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" onClick={() => editUser(record)}>Edit</Button>
          <Popconfirm title="Delete user?" onConfirm={() => deleteUser(record._id)}>
            <Button danger size="small">Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const requestColumns = [
    { title: 'Blood Group', dataIndex: 'bloodGroup', key: 'bloodGroup' },
    { title: 'Units', dataIndex: 'units', key: 'units' },
    { title: 'Urgency', dataIndex: 'urgency', key: 'urgency' },
    { title: 'Hospital', dataIndex: 'hospital', key: 'hospital' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm title="Delete request?" onConfirm={() => deleteRequest(record._id)}>
          <Button danger size="small">Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  const appointmentColumns = [
    { title: 'Donor', dataIndex: 'donor', key: 'donor' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Hospital', dataIndex: 'hospital', key: 'hospital' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm title="Delete appointment?" onConfirm={() => deleteAppointment(record._id)}>
          <Button danger size="small">Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  const menuItems = [
    { key: "home", icon: <HomeOutlined />, label: "Dashboard" },
    { key: "users", icon: <UserOutlined />, label: "Users" },
    { key: "requests", icon: <FormOutlined />, label: "Requests" },
    { key: "appointments", icon: <CalendarOutlined />, label: "Appointments" },
    { key: "history", icon: <HistoryOutlined />, label: "Donor History" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="sidebar"
      >
        <div className="logoBox">
          <img className='logo' src={logo} alt="Logo" />
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

      <Layout>
        <Content className="content">
          {page === "home" && (
            <div>
              <Card className="card">
                <h1 className="welcomeTitle">Admin Dashboard 👑</h1>
                <p className="welcomeSub">System Administrator • Full Access</p>
              </Card>
              
              <Card className="card" title="System Overview">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '24px', margin: '0', color: '#A30029' }}>{users.length}</h3>
                    <p style={{ margin: '5px 0 0 0' }}>Total Users</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '24px', margin: '0', color: '#A30029' }}>{requests.length}</h3>
                    <p style={{ margin: '5px 0 0 0' }}>Total Requests</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '24px', margin: '0', color: '#A30029' }}>{appointments.length}</h3>
                    <p style={{ margin: '5px 0 0 0' }}>Total Appointments</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '24px', margin: '0', color: '#A30029' }}>{donorHistory.length}</h3>
                    <p style={{ margin: '5px 0 0 0' }}>Total Donations</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {page === "users" && (
            <Card className="card" title="Users Management">
              <Table dataSource={users} columns={userColumns} rowKey="_id" />
            </Card>
          )}

          {page === "requests" && (
            <Card className="card" title="Requests Management">
              <Table dataSource={requests} columns={requestColumns} rowKey="_id" />
            </Card>
          )}

          {page === "appointments" && (
            <Card className="card" title="Appointments Management">
              <Table dataSource={appointments} columns={appointmentColumns} rowKey="_id" />
            </Card>
          )}

          {page === "history" && (
            <Card className="card" title="Donor History">
              <Table 
                dataSource={donorHistory} 
                columns={[
                  { title: 'Date', dataIndex: 'date', key: 'date' },
                  { title: 'Place', dataIndex: 'place', key: 'place' },
                  { title: 'Units', dataIndex: 'units', key: 'units' },
                ]} 
                rowKey="_id" 
              />
            </Card>
          )}
        </Content>

        <Footer className="footer">
          Donate2Save © {new Date().getFullYear()} — Admin Dashboard
        </Footer>
      </Layout>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={showEditUser}
        onCancel={() => setShowEditUser(false)}
        onOk={updateUser}
        okText="Update"
      >
        {editingUser && (
          <div style={{ display: 'grid', gap: '10px' }}>
            <label>Name</label>
            <Input 
              value={editingUser.name} 
              onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} 
            />
            
            <label>Email</label>
            <Input 
              value={editingUser.email} 
              onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
            />
            
            <label>Password</label>
            <Input 
              value={editingUser.password} 
              onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} 
            />
            
            <label>Role</label>
            <Select 
              value={editingUser.role} 
              onChange={(value) => setEditingUser({...editingUser, role: value})}
              style={{ width: '100%' }}
            >
              <Select.Option value="donor">Donor</Select.Option>
              <Select.Option value="requester">Requester</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
            
            {editingUser.role === 'donor' && (
              <>
                <label>Blood Group</label>
                <Select 
                  value={editingUser.bloodGroup} 
                  onChange={(value) => setEditingUser({...editingUser, bloodGroup: value})}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="O+">O+</Select.Option>
                  <Select.Option value="O-">O-</Select.Option>
                  <Select.Option value="A+">A+</Select.Option>
                  <Select.Option value="A-">A-</Select.Option>
                  <Select.Option value="B+">B+</Select.Option>
                  <Select.Option value="B-">B-</Select.Option>
                  <Select.Option value="AB+">AB+</Select.Option>
                  <Select.Option value="AB-">AB-</Select.Option>
                </Select>
                
                <label>Phone</label>
                <Input 
                  value={editingUser.phone} 
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} 
                />
              </>
            )}
            
            {editingUser.role === 'requester' && (
              <>
                <label>Organization Name</label>
                <Input 
                  value={editingUser.orgName} 
                  onChange={(e) => setEditingUser({...editingUser, orgName: e.target.value})} 
                />
                
                <label>Contact</label>
                <Input 
                  value={editingUser.contact} 
                  onChange={(e) => setEditingUser({...editingUser, contact: e.target.value})} 
                />
              </>
            )}
            
            <label>City</label>
            <Input 
              value={editingUser.city} 
              onChange={(e) => setEditingUser({...editingUser, city: e.target.value})} 
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
}