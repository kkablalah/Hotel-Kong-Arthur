FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
COPY app.css /usr/share/nginx/html/app.css
COPY app.js /usr/share/nginx/html/app.js
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
