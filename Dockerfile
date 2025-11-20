# Usamos Nginx para servir archivos estáticos
FROM nginx:alpine

# Copiamos los archivos HTML, CSS y JS al directorio donde Nginx los sirve
COPY . /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

# El contenedor ya inicia Nginx automáticamente
