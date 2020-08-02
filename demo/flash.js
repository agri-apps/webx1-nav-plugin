(function () {
    let stack = 0;

    window.flash = function (msg, duration) {
        this.msg = msg;

        stack = stack + 1;

        let div = document.createElement('div');
        let posY = (stack * 40);
        div.innerHTML = msg;
        div.style.border = '2px solid #ccc';
        div.style.borderLeft = '5px solid green';
        div.style.padding = '20px';
        div.style.position = 'fixed';
        div.style.left = '50%';
        div.style.bottom = `${posY}px`;
        div.style.transform = 'translateX(-50%)';
        div.style.backgroundColor = 'white';
        div.style.zIndex = stack;
        
        
        document.body.appendChild(div);

        setTimeout(function () {
            div.parentNode.removeChild(div);
            stack = stack - 1;
            if (stack < 0) {
                stack = 0;
            }
        }, duration ? duration : 4000);

    }
})();