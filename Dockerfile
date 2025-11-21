# Usamos Nginx para servir archivos estáticos
FROM nginx:alpine

# Copiamos los archivos HTML, CSS y JS al directorio donde Nginx los sirve
COPY . /usr/share/nginx/html

# Copiamos la configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx corre en primer plano
CMD ["nginx", "-g", "daemon off;"]