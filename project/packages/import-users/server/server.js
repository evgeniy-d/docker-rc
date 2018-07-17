function Importusers(command, params, item) {
	var users = [
		{username: "a.bilous", email: "a.bilous@oiler.ua", password: "oiler123456789", name: "Александр Билоус"},
		{username: "a.kazaryan", email: "a.kazaryan@oiler.com.ua", password: "oiler123456789", name: "Ашот Казарян"},
		{username: "a.kozhushko", email: "a.kozhushko@oiler.com.ua", password: "oiler123456789", name: "Андрей Кожушко"},
		{username: "a.kruglik", email: "a.kruglik@oiler.ua", password: "oiler123456789", name: "Андрей Круглик"},
		{username: "a.libo", email: "a.libo@oiler.ua", password: "oiler123456789", name: "Андрей Либо"},
		{username: "a.markhai", email: "a.markhai@oiler.ua", password: "oiler123456789", name: "Анна Мархай"},
		{username: "a.odarchenko", email: "a.odarchenko@oiler.ua", password: "oiler123456789", name: "Артем Одарченко"},
		{username: "a.omelchenko", email: "a.omelchenko@oiler.ua", password: "oiler123456789", name: "Александр Омельченко"},
		{username: "a.osipchuk", email: "a.osipchuk@oiler.com.ua", password: "oiler123456789", name: "Александр Осипчук"},
		{username: "a.rabkov", email: "a.rabkov@oiler.com.ua", password: "oiler123456789", name: "Александр Рабков"},
		{username: "a.stadnik", email: "a.stadnik@oiler.ua", password: "oiler123456789", name: "Алена Стадник"},
		{username: "a.vlasenko", email: "a.vlasenko@oiler.com.ua", password: "oiler123456789", name: "Артур Власенко"},
		{username: "alexj", email: "a.seleznev@oiler.com.ua", password: "oiler123456789", name: "Алексей Селезнев"},
		{username: "andreysirotkin", email: "and.sirotkin@gmail.com", password: "oiler123456789", name: "Андрей Сироткин"},
		{username: "d.datsyuk", email: "d.datsyuk@oiler.ua", password: "oiler123456789", name: "Дмитрий Дацюк"},
		{username: "d.ivanko", email: "d.ivanko@oiler.ua", password: "oiler123456789", name: "Дмитрий Иванько"},
		{username: "d.kindruk", email: "d.kindruk@oiler.ua", password: "oiler123456789", name: "Денис Киндрук"},
		{username: "d.kondratenko", email: "d.kondratenko@oiler.com.ua", password: "oiler123456789", name: "Дмитрий Кондратенко"},
		{username: "d.palatov", email: "d.palatov@oiler.ua", password: "oiler123456789", name: "Дмитрий Палатов"},
		{username: "docs", email: "docs@oiler.com.ua", password: "oiler123456789", name: "Михаил Третьяков"},
		{username: "e.dragovoz", email: "e.dragovoz@oiler.ua", password: "oiler123456789", name: "Евгений Драговоз"},
		{username: "e.gzhybovskaya", email: "e.gzhybovskaya@oiler.ua", password: "oiler123456789", name: "Елизавета Гжибовская"},
		{username: "e.korshenyuk", email: "e.korshenyuk@oiler.ua", password: "oiler123456789", name: "Елена Коршенюк"},
		{username: "g.biletskaya", email: "g.biletskaya@oiler.ua", password: "oiler123456789", name: "Галина Билецкая"},
		{username: "i.bosiy", email: "i.bosiy@oiler.com.ua", password: "oiler123456789", name: "Игорь Босый"},
		{username: "i.kolomiyets", email: "i.kolomiyets@oiler.com.ua", password: "oiler123456789", name: "Ирина Коломиец"},
		{username: "i.kotlyarov", email: "i.kotlyarov@oiler.com.ua", password: "oiler123456789", name: "Иван Котляров"},
		{username: "i.rudnik", email: "i.rudnik@oiler.ua", password: "oiler123456789", name: "Инна Рудник"},
		{username: "i.sereda", email: "i.sereda@hotmail.com", password: "oiler123456789", name: "Игорь Середа"},
		{username: "kivenko", email: "kivenko@oiler.com.ua", password: "oiler123456789", name: "Константин Кивенко"},
		{username: "l.babayants", email: "l.babayants@oiler.ua", password: "oiler123456789", name: "Людмила Бабаянц"},
		{username: "lystopad_dmitriy", email: "d.lystopad@oiler.ua", password: "oiler123456789", name: "Дмитрий Листопад"},
		{username: "m.biryukov", email: "m.biryukov@oiler.ua", password: "oiler123456789", name: "Максим Бирюков"},
		{username: "m.kutnyak", email: "m.kutnyak@oiler.com.ua", password: "oiler123456789", name: "Михаил Кутняк"},
		{username: "m.levchenko", email: "m.levchenko@oiler.ua", password: "oiler123456789", name: "Михаил Левченко"},
		{username: "manager", email: "manager@oiler.com.ua", password: "oiler123456789", name: "Евгений Борисов"},
		{username: "max", email: "max@oiler.com.ua", password: "oiler123456789", name: "Максим Науменко"},
		{username: "n.denisenko", email: "n.denisenko@oiler.ua", password: "oiler123456789", name: "Наталья Денисенко"},
		{username: "n.dyakina", email: "n.dyakina@oiler.ua", password: "oiler123456789", name: "Наталья Дякина"},
		{username: "n.parshenkov", email: "n.parshenkov@oiler.ua", password: "oiler123456789", name: "Николай Паршенков"},
		{username: "n.tarasova", email: "n.tarasova@oiler.ua", password: "oiler123456789", name: "Наталия Тарасова"},
		{username: "nemkin", email: "nemkin@oiler.com.ua", password: "oiler123456789", name: "Алексей Немкин"},
		{username: "o.gavrish", email: "o.gavrish@oiler.ua", password: "oiler123456789", name: "Олег Гавриш"},
		{username: "o.khramtsov", email: "o.khramtsov@oiler.com.ua", password: "oiler123456789", name: "Олег Храмцов"},
		{username: "o.vitovskaya", email: "o.vitovskaya@oiler.ua", password: "oiler123456789", name: "Оксана Витовская"},
		{username: "olegberezyk", email: "o.berezyk@oiler.ua", password: "oiler123456789", name: "Олег Березюк"},
		{username: "p.rybin", email: "p.rybin@oiler.ua", password: "oiler123456789", name: "Павел Рыбин"},
		{username: "r.globa", email: "r.globa@oiler.ua", password: "oiler123456789", name: "Роман Глоба"},
		{username: "r.kohan", email: "r.kohan@oiler.com.ua", password: "oiler123456789", name: "Роман Кохан"},
		{username: "s.chernyavsky", email: "s.chernyavsky@oiler.com.ua", password: "oiler123456789", name: "Сергей Чернявский"},
		{username: "s.konakh", email: "s.konakh@oiler.ua", password: "oiler123456789", name: "Светлана Конах"},
		{username: "s.vlasenko", email: "s.vlasenko@oiler.ua", password: "oiler123456789", name: "Сергей Власенко"},
		{username: "security", email: "security@oiler.ua", password: "oiler123456789", name: "Юрий Михайлович"},
		{username: "service", email: "service@oiler.com.ua", password: "oiler123456789", name: "Дмитрий Обелец"},
		{username: "stadnik", email: "stadnik@oiler.com.ua", password: "oiler123456789", name: "Юрий Стадник"},
		{username: "t.melnichuk", email: "t.melnichuk@oiler.ua", password: "oiler123456789", name: "Татьяна Мельничук"},
		{username: "tatiana", email: "tatiana@oiler.com.ua", password: "oiler123456789", name: "Татьяна Цареградская"},
		{username: "v.berbenets", email: "v.berbenets@oiler.com.ua", password: "oiler123456789", name: "Вадим Бербенец"},
		{username: "v.korenyugin", email: "v.korenyugin@oiler.ua", password: "oiler123456789", name: "Василий Коренюгин"},
		{username: "v.oksentiuk", email: "v.oksentiuk@oiler.ua", password: "oiler123456789", name: "Виктория Оксентюк"},
		{username: "v.rostovsky", email: "v.rostovsky@oiler.com.ua", password: "oiler123456789", name: "Вячеслав Ростовский"},
		{username: "y.berezhnyak", email: "y.berezhnyak@oiler.ua", password: "oiler123456789", name: "Ярослав Бережняк"},
		{username: "y.bereznoy", email: "y.bereznoy@oiler.com.ua", password: "oiler123456789", name: "Юрий Березной"},
		{username: "y.gavrilenko", email: "y.gavrilenko@oiler.com.ua", password: "oiler123456789", name: "Юрий Гавриленко"},
		{username: "y.sevruk", email: "y.sevruk@oiler.ua", password: "oiler123456789", name: "Ярослав Севрук"},
		{username: "y.shvets", email: "y.shvets@oiler.com.ua", password: "oiler123456789", name: "Юрий Швец"}];

	for (var i in users) {
			var userData =  users[i];

			const createUser = {
				username: userData.username,
				password: userData.password,
				name: userData.name,
				joinDefaultChannels: true,
				email: userData.email
			};

			const _id = Accounts.createUser(createUser);

			const updateUser = {
				$set: {
					name: userData.name,
					roles: userData.roles || ['user'],
					settings: userData.settings || {}
				}
			};

			updateUser.$set.requirePasswordChange = true;
			updateUser.$set['emails.0.verified'] = true;

			Meteor.users.update({ _id }, updateUser);
	}
}

RocketChat.slashCommands.add('importusers', Importusers, {
	description: 'Import users',
});
