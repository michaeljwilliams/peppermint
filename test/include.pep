<div>
    <ol>
        {{(
            let user = "Michael";
            if(user) {
                {{{
                    <p>Hello ${ user }</p>
                }}}
            }
            let users = [
                "Michael"
                ,"Matthew"
                ,"Alexander"
            ];
            for(let i = 0; i < 3; i++) {
                {{{
                    <li>
                        <p>User ${i}: <strong>${ users[i] }</strong></p>
                    </li>
                }}}
            }
        )}}
    </ol>
    <p>Goodbye {{$ __Pep.user $}}</p>
</div>
