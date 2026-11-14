# S08 | AP6 — Configuración segura y exposición en Minikube

Proyecto de dos capas: API Node.js y MongoDB dentro de Minikube. MongoDB solo se expone mediante un servicio `ClusterIP`; el backend se publica con `NodePort`.

## Estructura

```text
k8s/
  00-namespace.yaml
  01-app-configmap.yaml
  02-db-secret.yaml
  03-mongo-stack.yaml
  04-backend-stack.yaml
src/
  Dockerfile
  package.json
  server.js
```

## Requisitos

- Minikube, kubectl y Docker instalados.
- Perfil de Minikube iniciado con recursos suficientes (por ejemplo, 2 CPU y 3 GB de memoria).

## Despliegue en PowerShell

Desde la raíz del repositorio:

```powershell
minikube start --cpus=2 --memory=3072
minikube image build -t practica-s08-backend:1.0 ./src
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-app-configmap.yaml
kubectl apply -f k8s/02-db-secret.yaml
kubectl apply -f k8s/03-mongo-stack.yaml
kubectl apply -f k8s/04-backend-stack.yaml
kubectl rollout status deployment/mongo -n practica-s08
kubectl rollout status deployment/backend -n practica-s08
```

El PVC necesita que el complemento de almacenamiento de Minikube esté habilitado. Si queda pendiente:

```powershell
minikube addons enable storage-provisioner
```

## Validación y capturas

1. **Estado de recursos:** `kubectl get pods,svc,configmaps,secrets -n practica-s08`. Espera a que los Pods estén `Running` y listos.
2. **Variables inyectadas:** encuentra el Pod con `kubectl get pods -n practica-s08 -l app=backend` y ejecuta:

   ```powershell
   kubectl exec -it deployment/backend -n practica-s08 -- env
   ```

   El comando mostrará también el valor del Secret. En una publicación pública, no subas una captura que revele credenciales; usa las credenciales de demostración o redacta `DB_PASS`.

3. **Acceso por NodePort:**

   ```powershell
   minikube service backend-service -n practica-s08 --url
   ```

   Abre la URL que imprime el comando. La respuesta JSON indica que la API insertó una visita en MongoDB.

Comandos útiles para documentar el despliegue:

```powershell
kubectl logs deployment/backend -n practica-s08
kubectl describe pod -n practica-s08 -l app=backend
kubectl get endpoints -n practica-s08
```

## Configuración y seguridad

- `01-app-configmap.yaml` contiene host, nombre de base de datos y puerto; son parámetros no sensibles.
- `02-db-secret.yaml` contiene usuario y contraseña. `data` exige valores Base64, pero Base64 **no cifra ni protege** el Secret. Los valores del repositorio son solo para demostración; sustitúyelos antes de compartir el repositorio.
- En Kubernetes real, restringe el acceso RBAC a Secrets y habilita cifrado en reposo del almacén de datos del clúster.
- El contenedor del backend usa UID/GID 1000, sistema raíz de solo lectura, sin escalamiento de privilegios y con capacidades Linux eliminadas.
- Liveness consulta `/healthz`; readiness consulta `/readyz`, que espera a que MongoDB esté conectada.

## Diagnóstico rápido

- Si el backend no inicia, revisa `kubectl logs deployment/backend -n practica-s08` y confirma que existan `app-config` y `db-secret` en `practica-s08`.
- Si no conecta a MongoDB, valida `kubectl get pods,svc -n practica-s08`, el endpoint `mongo-service:27017`, y los nombres de las claves `DB_USER` y `DB_PASS` en el Secret.
- Si no pasa readiness, revisa logs y eventos con `kubectl describe pod -n practica-s08 -l app=backend`; espera a que MongoDB esté lista.
- Si Minikube no asigna URL NodePort, comprueba que `backend-service` tenga `TYPE NodePort`, el puerto `30080` y un endpoint asociado.

## Guion breve para Google Docs y video

Explica que ConfigMap separa parámetros no confidenciales y Secret separa credenciales; enseña los YAML; despliega y valida Pods/servicios; muestra la URL de Minikube y la respuesta de la API; termina mostrando las variables inyectadas sin exponer credenciales reales.

> Antes de grabar, verifica el estado de los recursos y captura tus propios resultados de Minikube. Este repositorio es la base técnica; no incluye capturas ni enlaces de entrega porque deben corresponder a tu ejecución y cuentas.
