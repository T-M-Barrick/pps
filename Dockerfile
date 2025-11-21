# Usamos Nginx para servir archivos estáticos
FROM nginx:alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/share/nginx/html

# Copiamos los archivos HTML, CSS y JS al directorio donde Nginx los sirve
COPY . /usr/share/nginx/html

# Copiamos la plantilla de configuración de Nginx
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Nginx corre en primer plano
# Reemplaza $PORT con la variable de entorno que Railway asigna y arranca Nginx
CMD envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf \
    && nginx -g 'daemon off;'