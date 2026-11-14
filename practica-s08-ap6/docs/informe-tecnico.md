# Informe técnico — S08 | AP6

**Estudiante(s):** [Completar]  
**Curso:** Orquestación y Automatización de Software  
**Entorno:** Minikube + kubectl  
**Repositorio público:** [Pegar enlace después de publicar]

## 1. Arquitectura implementada

La solución usa un backend Node.js y una base MongoDB desplegados en el namespace `practica-s08`. MongoDB se alcanza internamente por `mongo-service` (`ClusterIP`). El backend lee `DB_HOST`, `DB_NAME` y `APP_PORT` del ConfigMap; toma `DB_USER` y `DB_PASS` del Secret; y se expone con `backend-service` (`NodePort`, 30080).

## 2. Separación de configuración y seguridad

El ConfigMap almacena parámetros no sensibles. El Secret almacena las credenciales codificadas en Base64. Base64 no cifra el contenido, por lo que el acceso al Secret debe limitarse y no se deben publicar credenciales reales.

El contenedor backend se ejecuta como UID 1000, tiene sistema raíz de solo lectura y no puede escalar privilegios. Liveness consulta `/healthz`; readiness consulta `/readyz` y solo responde listo cuando la conexión a MongoDB está disponible.

## 3. Evidencias de ejecución

### Evidencia 1 — Estado del clúster

Ejecuta `kubectl get pods,svc,configmaps,secrets -n practica-s08` y pega aquí una captura donde los dos Pods estén `Running` y listos.

**Explicación:** [Indicar qué objetos aparecen y confirmar que MongoDB solo tiene servicio ClusterIP y el backend tiene NodePort.]

> Insertar captura aquí.

### Evidencia 2 — Variables inyectadas

Ejecuta `kubectl exec -it deployment/backend -n practica-s08 -- env` y pega aquí una captura. Oculta `DB_PASS` si la captura se publicará.

**Explicación:** [Identificar variables del ConfigMap y las claves del Secret sin revelar una contraseña real.]

> Insertar captura aquí.

### Evidencia 3 — Acceso externo y conexión a MongoDB

Ejecuta `minikube service backend-service -n practica-s08 --url`, abre la URL y pega aquí una captura de la respuesta JSON.

**Explicación:** [Describir la respuesta y cómo `totalVisits` confirma que el backend guardó datos en MongoDB.]

> Insertar captura aquí.

## 4. Verificación y diagnóstico

Comandos usados:

```text
kubectl logs deployment/backend -n practica-s08
kubectl describe pod -n practica-s08 -l app=backend
kubectl get endpoints -n practica-s08
```

**Hallazgos:** [Registrar errores encontrados, evidencia en logs/eventos y solución aplicada. Si el despliegue funcionó a la primera, indícalo con honestidad.]

## 5. Conclusiones

[Resumir qué se aprendió sobre ConfigMaps, Secrets, comunicación entre Pods y exposición NodePort.]

## 6. Video demostrativo

**Enlace:** [Pegar URL de YouTube no listado o Google Drive con permisos de lectura]
