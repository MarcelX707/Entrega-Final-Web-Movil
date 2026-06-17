// src/pages/dashboard/AdminDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButtons, IonBadge, IonGrid, IonRow, IonCol,
  IonList, IonItem, IonLabel, IonButton, IonIcon,
  IonBackButton, IonLoading, IonToast
} from '@ionic/react';
import { trashOutline, logOutOutline, peopleOutline, statsChartOutline, shieldOutline } from 'ionicons/icons';
import api from '../../services/api';

interface UsuarioDB {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rut: string;
  id_rol: number;
}

const AdminDashboardPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioDB[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsuarios(res.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario permanentemente?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      setUsuarios(prev => prev.filter(u => u.id_usuario !== id));
      setMensaje('Usuario eliminado con éxito');
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setMensaje('Error al eliminar usuario');
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const handleToggleRole = async (user: UsuarioDB) => {
    const nuevoRol = user.id_rol === 2 ? 1 : 2;
    const actionText = nuevoRol === 2 ? 'promover a Administrador' : 'degradar a Usuario común';
    if (!window.confirm(`¿Estás seguro de que deseas ${actionText} a ${user.nombre}?`)) return;
    try {
      await api.put(`/auth/users/${user.id_usuario}/role`, { id_rol: nuevoRol });
      setUsuarios(prev => prev.map(u => u.id_usuario === user.id_usuario ? { ...u, id_rol: nuevoRol } : u));
      setMensaje('Rol de usuario actualizado con éxito');
    } catch (error: any) {
      console.error('Error al actualizar rol:', error);
      const errMsg = error.response?.data?.error || 'Error al actualizar rol';
      setMensaje(errMsg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" text="VOLVER" />
          </IonButtons>
          <IonTitle>
            Panel Administrativo
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f4f5f8' }}>
        <IonLoading isOpen={cargando} message="Cargando datos de administración..." />
        
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeLg="10">
              <IonCard style={{ borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center' }}>
                    <IonIcon icon={peopleOutline} style={{ marginRight: '10px' }} />
                    Gestión de Usuarios
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {usuarios.map((u) => (
                      <IonItem key={u.id_usuario} lines="full" style={{ '--padding-vertical': '10px' }}>
                        <IonLabel>
                          <h2 style={{ fontSize: '1.1rem', fontWeight: '500' }}>{u.nombre} {u.apellido}</h2>
                          <p style={{ margin: '4px 0' }}>{u.correo} | RUT: {u.rut}</p>
                          <IonBadge 
                            color={u.id_rol === 2 ? 'danger' : 'secondary'} 
                            style={{ padding: '5px 10px', borderRadius: '4px', textTransform: 'capitalize' }}
                          >
                            {u.id_rol === 2 ? 'Administrador' : 'Usuario'}
                          </IonBadge>
                        </IonLabel>
                        <IonButton 
                          slot="end" 
                          fill="clear" 
                          color={u.id_rol === 2 ? 'warning' : 'primary'} 
                          onClick={() => handleToggleRole(u)}
                          disabled={u.correo === 'admin@gmail.com' || u.correo === currentUser.email}
                          title={u.id_rol === 2 ? 'Quitar administrador' : 'Hacer administrador'}
                          style={{ marginRight: '10px' }}
                        >
                          <IonIcon slot="icon-only" icon={shieldOutline} />
                        </IonButton>
                        <IonButton 
                          slot="end" 
                          fill="clear" 
                          color="danger" 
                          onClick={() => handleDeleteUser(u.id_usuario)}
                          disabled={u.correo === 'admin@gmail.com' || u.correo === currentUser.email}
                        >
                          <IonIcon slot="icon-only" icon={trashOutline} />
                        </IonButton>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast 
          isOpen={!!mensaje} 
          message={mensaje} 
          duration={2000} 
          onDidDismiss={() => setMensaje('')} 
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboardPage;
