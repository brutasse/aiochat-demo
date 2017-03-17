(function(undefined) {
    const attributeExceptions = ['role'];
    const appendText = (el, text) => {
        const textNode = document.createTextNode(text);
        el.appendChild(textNode);
    }

    const appendArray = (el, children) => {
        children.forEach((child) => {
            if (Array.isArray(child)) {
                appendArray(el, child);
            } else if (child instanceof window.Element) {
                el.appendChild(child)
            } else if (typeof child === 'string') {
                appendText(el, child);
            }
        });
    }

    const setStyles = (el, styles) => {
        if (!styles) {
            el.removeAttribute('styles');
            return;
        }

        Object.keys(styles).forEach((styleName) => {
            if (styleName in el.style) {
                el.style[styleName] = styles[styleName];
            } else {
                console.warn(`${styleName} is not a valid style for a <${el.tagName.toLowerCase()}>`);
            }
        });
    }

    const makeElement = (type, textOrPropsOrChild, ...otherChildren) => {
        const el = document.createElement(type);
        if (Array.isArray(textOrPropsOrChild)) {
            appendArray(el, textOrPropsOrChild);
        } else if (textOrPropsOrChild instanceof window.Element) {
            el.appendChild(textOrPropsOrChild);
        } else if (typeof textOrPropsOrChild === 'string') {
            appendText(el, textOrPropsOrChild);
        } else if (typeof textOrPropsOrChild === 'object') {
            Object.keys(textOrPropsOrChild).forEach((propName) => {
                if (propName in el || attributeExceptions.includes(propName)) {
                    const value = textOrPropsOrChild[propName];

                    if (propName === 'style') {
                        setStyles(el, value);
                    } else if (value) {
                        el[propName] = value;
                    }
                } else {
                    console.warn(`${propName} is not a valid property of a <${type}>`);
                }
            });
        }

        if (otherChildren) appendArray(el, otherChildren);
        return el;
    }

    const div = (...args) => makeElement('div', ...args);
    const span = (...args) => makeElement('span', ...args);
    const p = (...args) => makeElement('p', ...args);
    const h3 = (...args) => makeElement('h3', ...args);
    const strong = (...args) => makeElement('strong', ...args);
    const em = (...args) => makeElement('em', ...args);
    const table = (...args) => makeElement('table', ...args);
    const tr = (...args) => makeElement('tr', ...args);
    const td = (...args) => makeElement('td', ...args);
    const th = (...args) => makeElement('th', ...args);
    const thead = (...args) => makeElement('thead', ...args);
    const tbody = (...args) => makeElement('tbody', ...args);
    const form = (...args) => makeElement('form', ...args);
    const fieldset = (...args) => makeElement('fieldset', ...args);
    const input = (...args) => makeElement('input', ...args);
    const label = (...args) => makeElement('label', ...args);

    const store = {
        users: [],
        text: "",
        username: "",
        messages: [],
    }
    const LIMIT = 20;

    const events = new EventSource('/events');

    events.onmessage = msg => {
        payload = JSON.parse(msg.data);
        console.log(payload);
        switch (payload.type) {
            case "username":
                store.username = payload.username;
                break;
            case "users":
                store.users = payload.users.sort();
                break;
            case "join":
                store.users = [...store.users, payload.username].sort();
                break;
            case "quit":
                const index = store.users.indexOf(payload.username)
                store.users.splice(index, 1);
                break;
            case "message":
                store.messages.push({
                    author: payload.author,
                    message: payload.message,
                });
                while (store.messages.length > LIMIT) {
                    store.messages.shift();
                }
                break;
            default:
                console.warn(`Unhandled event type ${payload.type}`);
        }

        render();
    }

    const UserList = store => (
        table(
            thead(tr(th('Users'))),
            tbody(store.users.map(name => {
                if (name === store.username) {
                    name = strong(name);
                }
                return tr(td((name)));
            })))
    );

    const InputBox = store => (
        form(fieldset(
            label({htmlFor: 'msg'}),
            input({
                placeholder: 'Type your message…',
                id: 'msg',
                name: 'text',
                type: 'text',
                autofocus: true,
                value: store.text,
                onkeyup: e => {
                    store.text = e.target.value;
                },
            }),
            input({
                className: 'button-primary',
                value: 'Send',
                type: 'submit',
                onclick: e => {
                    e.preventDefault();
                    fetch('/events', {
                        method: 'POST',
                        body: JSON.stringify({
                            type: 'message',
                            author: store.username,
                            message: store.text,
                        }),
                        headers: new Headers({'Content-Type': 'application/json'}),
                    }).then(resp => {
                        store.text = '';
                        render();
                        setTimeout(() => {
                            document.getElementById('msg').focus();
                        }, 0);
                    });
                },
            })))
    );

    const Messages = store => (
        div(
            h3("Chat"),
            store.messages.map(msg => {
                let author = msg.author;
                if (author === store.username) {
                    author = strong(msg.author);
                } else {
                    author = em(msg.author);
                }
                return p(author, ": ", msg.message);
            }))
    );

    render = () => {
        const app = document.getElementById('app')
        app.parentElement.replaceChild(
            div({id: 'app'},
                div({className: 'row'},
                    div({className: 'column column-75'},
                        Messages(store),
                        InputBox(store)),
                    div({className: 'column'}, UserList(store)))),
            app);
    };
})()
