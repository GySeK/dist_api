# Distantik API
Принципиально новая платформа для дистанционного обученя которая будет работать хуже чем moodle, но зато файлики 10 мегабайт
## Документация
будет
## Инструкция по развертыванию
В дальнейшем будет написана инструкция по запуску в которой каждый, я повторяю КАЖДЫЙ пункт должен быть выполнен
### Требования
1) Во первых нужна операционная система Window 10/11 c WSL или Линукс 🤡
2) Во вторых должен быть установлен nodejs
3) В третьих должна быть установлена база данных postgresql(как ее установить разберешься сам не маленький уже)
### Непосредственно инструкция
1) Для скачивания модулей `npm install`(если папка node_modules существовала до запуска комманды, то ее нужно удалить)
2) Нужно настроить конфиги под себя в папку initz файл config.json (дохуя важная ремарка: БД указаная в конфиге должна быть заранее создана)
3) В директории проекта выполни комманду `npm run init`
4) Для запуска в режиме разработчика `npm run dev`, для продакшена `npm run dev`
5) Сделай 20 отжиманий
## Использование
1) По умолчанию после генерации БД будет создан пользователь с логином, именем и паролем "admin"
2) Для того чтобы не выдавала при запросе ошибку авторизации нужно воспользоваться функцией /get/token скопировать результат и закинуть либо в header перед этим записав тип токена в нашем случае Bearer(Bearer asdfasdf), сделать это можно и удобнее в postman создать новый запрос и найти кнопку "Autorization" там в типе выбираем Bearer и просто записываем токен