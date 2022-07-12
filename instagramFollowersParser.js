// Рекомендуется отключить картинки для сайта Instagram, чтобы ускорить процесс.

// Задержка перед следующей прокруткой, в миллисекундах.
const SCROLL_DELAY = 1000;

// Время ожидания отклика "Наблюдателя за изменениями" ("MutationObserver"), в миллисекундах.
// Если маленькая скорость интернета, и часто появляется ошибка про "наблюдателя", то увеличьте её.
const OBSERVER_TIMEOUT = 5000;

// Сколько собрать подписчиков.
// 0 - без ограничений.
// Чем больше число, тем больше шанс возникновения ошибки 429 ("Слишком много запросов") - ограничение Instagram.
var userCount = 0;

// Для сбора имен аккаунтов укажите "true".
// Если у подписчика нет имени, тогда выдаст "(*имя отсутствует*) ID_пользователя".
const GET_USERNAMES = true; // true, false



const OBSERVER_CONF = {
    attributes: false,
    childList: true,
    subtree: false
};
var observer = new MutationObserver(async (mutations, obs) => {
	if (mutations[0]?.addedNodes[0]?.className == "_aanq")
        await onListLoaded();
});
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const errorStyle = "color: #a22e1c; font-size:18px;";

var resultsList = []
var lastTime;
var finished, switchedMode;

async function onListLoaded(init = false) {
	lastTime = Date.now();
	
	if (resultsList.length == userCount)
		return;
	
	try {
		var countDiff;
		if (!init) {
			await sleep(SCROLL_DELAY);
			
			followersDiv.scrollTo(0, 0);
			
			countDiff = followersList.childElementCount - lastCount;
			for (let i = 0; i < countDiff; i++)
				followersList.children[0].remove();
		}
		else
			countDiff = followersList.children.length;
		
		let len = followersList.children.length;
		for (let i = len - countDiff; i < len; i++) {
			let followerLi = followersList.children[i];
			
			let followerValues = followerLi.getElementsByClassName("_ab9o")[0]
							  ?? followerLi.getElementsByClassName("_aaeo")[0];
			if (followerValues == undefined)
				throw new Error("Не найден элемент с именем и ником подписчика");
			
			let followerValue = followerValues.children[GET_USERNAMES ? 1 : 0]?.innerText;
			if (followerValue == undefined || followerValue.length == 0)
				followerValue = "(*имя отсутствует*) " + followerValues.children[0]?.innerText;
			
			if (followerValue == undefined || followerValue.length == 0)
				throw new Error("Не найдено значение ника/ID подписчика");
			
			resultsList.push(followerValue);
			
			if (resultsList.length == userCount) {
				onFinish();
				return;
			}
		}
		
		// Если больше нечего загружать (отсутствует элемент - датчик прокрутки до конца)
		if (followersDiv.getElementsByClassName("_aanq").length == 0) {
			onFinish();
			return;
		}
		
		document.title = `Собрано: ${resultsList.length}.`;
		
		lastCount = followersList.childElementCount;
		
		followersDiv.scrollTo(0, followersDiv.scrollHeight);
		
		if (switchedMode)
			monitorChanges();
		// Если близко к концу списка, сменить режим "наблюдателя"
		else if (resultsList.length + lastCount > totalCount) {
			switchedMode = true;
			while (!finished)
				await sleep(50);
			finished = false;
			
			observer.disconnect();
			
			observer = new MutationObserver((mutations, obs) => {
				lastTime = Date.now();
			});
			observer.observe(followersList, OBSERVER_CONF);
			monitorChanges();
		}
	}
	catch (err) {
		finished = true;
		let resultsMsg = outputResultsOnError();
		console.log("%cПроизошла ошибка в процессе парсинга - " + err + "." + resultsMsg, errorStyle);
		observer.disconnect();
	}
}
function onFinish() {
	finished = true;
	observer.disconnect();
	
	console.log(resultsList.join('\n'));
	console.log("%cЗавершено успешно.\n" +
				  "Собрано подписчиков: " + resultsList.length + ".", "color: #13a555; font-size:18px;");
	console.log("%cВыделите собранные данные аккаунтов выше и нажмите Ctrl-C (или серую кнопку \"Copy\" в конце выведенных данных) чтобы скопировать.", "color: #13a555; font-size:16px;");
}

var lastHeight;
async function monitorChanges() {
	lastTime = Date.now();
	while (!finished) {
		// Если с последних изменений прошло больше 2 секунд
		if (Date.now() - lastTime > 2000) {
			// (иногда отображаемое кол-во меньше кол-ва в списке)
			if (followersDiv.scrollHeight != lastHeight)
				onListLoaded();
			else
				onFinish();
			
			lastHeight = followersDiv.scrollHeight;
			break;
		}
		
		await sleep(100);
	}
}
function isLoading() {
	// Проверить, есть ли в конце списка элемент - значок загрузки
	let classNameLast = followersList.lastElementChild.className;
	let classNamePreLast = followersList.children[followersList.children.length - 2].className;
	
	return classNameLast != classNamePreLast; 
}
function outputResultsOnError() {
	if (resultsList.length > 0) {
		console.log(resultsList.join("\n"));
		return `\nВыше выведены собранные данные аккаунтов (${resultsList.length}).`;
	}
	else
		return "";
}


try {
	var followersDiv = document.getElementsByClassName("_aano")[0];
	if (followersDiv == undefined)
		throw new Error("Не найдено всплывающее окно с подписчиками");
	
	var followersList = followersDiv.getElementsByClassName("_aaey")[0]?.getElementsByClassName("_aae-")[0];
	if (followersList == undefined)
		throw new Error("Не найден элемент - список подписчиков");
	
	let followersCountCont = document.getElementsByClassName("_aa_8")[0].children[1];
	let followersCountSpan = followersCountCont.getElementsByClassName("_ac2a _ac2b")[0];
	if (followersCountSpan == undefined)
		throw new Error("Не найден элемент, содержащий кол-во подписчиков");
	
	if (!(followersCountSpan.nextSibling.textContent.contains("подписчик")
	      || followersCountSpan.nextSibling.textContent.contains("follower")))
		throw new Error("Не найден элемент, содержащий кол-во подписчиков");
	
	var totalCount = parseInt(followersCountSpan.title.replace(/[^\d]/g, ""));
	if (totalCount == 0)
		throw new Error("Нет подписчиков");
	
	console.log("%cВНИМАНИЕ! Использование данного скрипта может привести к блокировке вашего аккаунта!\n" +
				"Чтобы снизить риск, измените значение переменной \"SCROLL_DELAY\" (в начале скрипта) как можно больше - например, 15000 (15 секунд).",
				"color: #a22e1c; font-size:18px;");
	
	console.log("%cОбщее количество аккаунтов для сбора: " + totalCount + ".",
				"color: #13a555; font-size:16px;");
	if (userCount != 0) {
        console.log("%cЛимит, заданный пользователем: " + userCount + ".",
					"color: #13a555; font-size:16px;");
    }
	
	var lastCount = followersList.childElementCount;
	
	if (userCount > totalCount || userCount == 0)
		userCount = totalCount;
	
	console.log("%cНачался сбор данных, дождитесь выполнения...\n" +
				"(чтобы остановить, введите \"onFinish();\" без кавычек и нажмите Enter)",
				"color: #13a555; font-size:16px;");
	observer.observe(followersDiv, OBSERVER_CONF);
	await onListLoaded(true);
	
	var loadingStarted = false;
	while (!finished) {
		if (switchedMode) {
			finished = true;
			break;
		}
		
		let timeDiff = Date.now() - lastTime;
		if (timeDiff > OBSERVER_TIMEOUT) {
			if (isLoading()) {
				loadingStarted = true;
				
				// Если список загружается дольше, чем время ожидания отклика "наблюдателя" в 2 раза
				if (timeDiff > OBSERVER_TIMEOUT * 2) {
					let resultsMsg = outputResultsOnError();
					console.log("%cПревышено время ожидания загрузки списка." + resultsMsg,
								errorStyle);
					observer.disconnect();
					break;
				}
			}
			else if (loadingStarted) {
				// Если список загрузился
				loadingStarted = false;
				lastTime = Date.now();
			}
			else {
				// Если список полностью загрузился
				if (followersDiv.getElementsByClassName("_aanq").length == 0) {
					onFinish();
					break;
				}
				
				let resultsMsg = outputResultsOnError();
				console.log("%c\"Наблюдатель за изменениями\" (\"MutationObserver\") не отвечает - попробуйте закрыть и открыть вкладку." + resultsMsg,
							errorStyle);
				observer.disconnect();
				break;
			}
		}
			
		await sleep(200);
	}
}
catch (err) {
	let resultsMsg = outputResultsOnError();
	console.log("%cПроизошла ошибка:\n" + err + "." + resultsMsg, errorStyle);
	observer.disconnect();
}