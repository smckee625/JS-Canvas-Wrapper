function calculateAllCrossProduct(points)
{
    var lastSign = null;

    for (var i = 2; i < points.length; i++)
    {
        //calculate crossproduct from 3 consecutive points
        var crossproduct = calculateCrossProduct(points[i - 2](), points[i - 1](), points[i]());
        var currentSign = Math.sign(crossproduct);
        if (lastSign == null)
        {
            //last sign init
            lastSign = currentSign;
        }

        var checkResult = checkCrossProductSign(lastSign, currentSign);
        if (checkResult == false)
        {
            //different sign in cross products,no need to check the remaining points --> concave polygon --> return function
            return false;
        }
        lastSign = currentSign;
    }

    //first point must check between second and last point, this is the last 3 points that can break convexity
    var crossproductFirstPoint = calculateCrossProduct(points[points.length - 2](), points[0](), points[1]());

    //I changed this because when a straight line had 3 points in it instead of the typical 2 it would return not a convex polygon
    return lastSign >= 0 && Math.sign(crossproductFirstPoint) >= 0;
    // return checkCrossProductSign(lastSign, Math.sign(crossproductFirstPoint));
}

function checkCrossProductSign(lastSign, newSign)
{
    if (lastSign !== newSign)
    {
        //checked sign differs from the previous one --> concave polygon
        return false;
    }
    return true;
}

function calculateCrossProduct(p1, p2, p3)
{
    var dx1 = p2.x - p1.x;
    var dy1 = p2.y - p1.y;
    var dx2 = p3.x - p2.x;
    var dy2 = p3.y - p2.y;

    var zcrossproduct = dx1 * dy2 - dy1 * dx2;
    return zcrossproduct;
}

function isPolygonConvex(points)
{
    //Added this because it doesn't check the first and last points angle
    points.push(points[0]);
    let val = calculateAllCrossProduct(points);
    points.pop();
    return val;
}
export { isPolygonConvex };