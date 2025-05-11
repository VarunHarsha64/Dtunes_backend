export const testRouteHandler = (req, res) => {

    try {
        const { name, age } = req.body;

        if (!name || !age) {
            return res.status(400).json({
                success: false,
                message: 'Name and age is mandatory!',

            });
        }

        res.status(200).json({
            message: `Hello ${name}, you are ${age} years old!`,
            success: true,
            data: {
                name: name,
                age: age
            }
        });
    } catch (error) {
        console.error("Error in /api/test");
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }


}