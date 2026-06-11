import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonSelect,
  IonSelectOption, IonButtons, IonBackButton, IonLoading, IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import api from '../../services/api';

interface CarpetaDB {
  id_carpeta: number;
  nombre_carpeta: string;
}

const NewDocumentPage: React.FC = () => {
  const history = useHistory();
  const [nombre, setNombre] = useState('');
  const [idCarpeta, setIdCarpeta] = useState<number | null>(null);
  const [url, setUrl] = useState('');
  const [carpetas, setCarpetas] = useState<CarpetaDB[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const fetchCarpetas = async () => {
      try {
        const res = await api.get('/carpetas');
        setCarpetas(res.data);
      } catch (error) {
        console.error('Error al cargar carpetas:', error);
      }
    };
    fetchCarpetas();
  }, []);

  const handleSave = async () => {
    if (!nombre || !idCarpeta) {
      setMensaje('Por favor, completa los campos obligatorios.');
      return;
    }

    setCargando(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await api.post('/documentos', {
        id_carpeta: idCarpeta,
        nombre_archivo: nombre,
        ruta_almacenamiento: url,
        subido_por: user?.id
      });
      setMensaje('Documento creado con éxito.');
      setTimeout(() => history.push('/documents'), 1500);
    } catch (error) {
      console.error('Error al crear documento:', error);
      setMensaje('Error al crear el documento.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/documents" text="Cancelar" />
          </IonButtons>
          <IonTitle>Nuevo Documento</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonLoading isOpen={cargando} message="Guardando documento..." />
        
        <IonItem>
          <IonLabel position="stacked">Nombre del Documento *</IonLabel>
          <IonInput 
            value={nombre} 
            onIonChange={e => setNombre(e.detail.value!)} 
            placeholder="Ej: Resolución de Patente"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Carpeta Destino *</IonLabel>
          <IonSelect 
            value={idCarpeta} 
            placeholder="Selecciona una carpeta"
            onIonChange={e => setIdCarpeta(e.detail.value)}
          >
            {carpetas.map(c => (
              <IonSelectOption key={c.id_carpeta} value={c.id_carpeta}>
                {c.nombre_carpeta}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">URL o Ruta del Archivo</IonLabel>
          <IonInput 
            value={url} 
            onIonChange={e => setUrl(e.detail.value!)} 
            placeholder="https://..."
          />
        </IonItem>

        <div style={{ marginTop: '20px' }}>
          <IonButton expand="block" onClick={handleSave}>Crear Documento</IonButton>
          <IonButton expand="block" fill="clear" onClick={() => history.push('/documents')}>Cancelar</IonButton>
        </div>

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

export default NewDocumentPage;
